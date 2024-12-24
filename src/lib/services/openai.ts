import OpenAI from "openai";
import { getRandomWords } from "@/lib/api";
import { PuzzleStructure } from "./puzzle";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getEmbedding(text: string) {
  console.log(
    "[OpenAI Embedding] Requesting embedding for text:",
    text.substring(0, 50) + "..."
  );
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    console.log("[OpenAI Embedding] Successfully generated embedding");
    return response.data[0].embedding;
  } catch (error) {
    console.error("[OpenAI Embedding] Error generating embedding:", error);
    throw error;
  }
}

export async function generatePuzzleWithAI(promptData: {
  structure: PuzzleStructure;
  prompt: string;
}) {
  console.log(
    "[OpenAI Generate] Requesting puzzle generation with prompt:",
    promptData.prompt.substring(0, 100) + "..."
  );

  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const puzzleType = promptData.structure.metadata.category;
      let preSelectedWords: string[] = [];

      if (puzzleType === "wordsearch") {
        const terms = await getRandomWords(6);
        preSelectedWords = terms.map((term) => term.term);
        // Modify the structure to use our pre-selected words
        promptData.structure.preSelectedWords = preSelectedWords;

        // For word search, use a simpler prompt with fewer tokens
        const response = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content:
                "Create a 10x10 word search grid using ONLY the provided words. Place words horizontally, vertically, or diagonally. Fill remaining spaces with random uppercase letters. Return a JSON object with 'grid' (10x10 array of uppercase letters) and 'words' (array of words used).",
            },
            {
              role: "user",
              content: `Create a word search puzzle using these words: ${preSelectedWords.join(
                ", "
              )}`,
            },
          ],
          temperature: 0.5,
          max_tokens: 1000,
        });

        const puzzleContent = response.choices[0]?.message?.content;
        if (!puzzleContent) {
          throw new Error("No content in response from OpenAI");
        }

        try {
          const parsedContent = JSON.parse(puzzleContent);

          // Validate the response
          if (
            !Array.isArray(parsedContent.grid) ||
            !Array.isArray(parsedContent.words)
          ) {
            throw new Error(
              "Invalid word search format: missing grid or words"
            );
          }

          // Validate grid structure
          if (
            !parsedContent.grid.every(
              (row: unknown) =>
                Array.isArray(row) &&
                row.length === 10 &&
                row.every(
                  (cell: unknown) =>
                    typeof cell === "string" &&
                    cell.length === 1 &&
                    /^[A-Z]$/.test(cell)
                )
            )
          ) {
            throw new Error(
              "Invalid grid format - must be 10x10 array of uppercase letters"
            );
          }

          // Validate words
          const upperWords = preSelectedWords.map((w) => w.toUpperCase());
          if (!upperWords.every((word) => parsedContent.words.includes(word))) {
            throw new Error(
              "Not all required words are included in the puzzle"
            );
          }

          return {
            ...promptData.structure,
            grid: parsedContent.grid,
            words: upperWords,
          };
        } catch (parseError) {
          console.error(
            "[OpenAI Generate] Failed to parse or validate response:",
            parseError
          );
          throw parseError;
        }
      } else if (puzzleType === "anagram") {
        // For anagrams, ignore the context and use a direct prompt
        const response = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: `You are a Solana blockchain expert creating anagram puzzles. Choose a word from:
- Solana-specific terms (SEALEVEL, GULFSTREAM)
- Blockchain terms (VALIDATOR, STAKING)
- DeFi terms (SERUM, RAYDIUM)
- NFT terms (METAPLEX, CANDY)
- Technical terms (PROGRAM, ACCOUNT)
- Projects (PHANTOM, MAGIC)

Rules:
1. Choose a single word, 5-12 letters long
2. Avoid common words like "SOLANA"
3. Take the chosen word and randomly rearrange its letters to create the scrambled version
4. Include 2-3 helpful hints about the term's meaning and usage

Example:
If you choose "PHANTOM", you might scramble it to "HAMPNT" or "THANPM"

Return a JSON object with:
{
  "title": "Solana Anagram Challenge",
  "content": "SCRAMBLED_VERSION",
  "solution": "ORIGINAL_WORD",
  "hints": ["Hint 1", "Hint 2"],
  "explanation": "Brief explanation of what this term means",
  "points": 100
}`,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        });

        const puzzleContent = response.choices[0]?.message?.content;
        if (!puzzleContent) {
          throw new Error("No content in response from OpenAI");
        }

        try {
          const parsedContent = JSON.parse(puzzleContent);

          // Validate the anagram puzzle
          if (!parsedContent.solution || !parsedContent.content) {
            throw new Error(
              "Invalid anagram format: missing solution or scrambled word"
            );
          }

          const solution = parsedContent.solution
            .toUpperCase()
            .replace(/[^A-Z]/g, "");
          const scrambled = parsedContent.content
            .toUpperCase()
            .replace(/[^A-Z]/g, "");

          // Ensure both words only contain letters and are the same length
          if (solution.length === 0 || solution.length !== scrambled.length) {
            throw new Error("Invalid word format or length mismatch");
          }

          // Ensure the scrambled word contains exactly the same letters
          const sortedSolution = solution.split("").sort().join("");
          const sortedScrambled = scrambled.split("").sort().join("");
          if (sortedSolution !== sortedScrambled) {
            throw new Error("Scrambled word doesn't match the solution");
          }

          // Ensure the scrambled word is different from the solution
          if (scrambled === solution) {
            throw new Error("Scrambled word is the same as the solution");
          }

          return {
            ...promptData.structure,
            title: parsedContent.title || "Solana Anagram Challenge",
            content: scrambled,
            solution: solution,
            hints: parsedContent.hints || [],
            explanation: parsedContent.explanation || "",
            points: parsedContent.points || 100,
            timeLimit: 300,
          };
        } catch (parseError) {
          console.error(
            "[OpenAI Generate] Failed to parse or validate anagram:",
            parseError
          );
          throw parseError;
        }
      } else {
        // For other puzzle types, use the original implementation
        const response = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content:
                "You are a puzzle generator that creates educational puzzles about blockchain and cryptocurrency topics. " +
                (puzzleType === "quiz"
                  ? "For quiz questions:\n" +
                    "1. Generate unique and non-repetitive questions.\n" +
                    "2. Focus on testing understanding rather than memorization.\n" +
                    "3. Make sure all options are plausible but only one is correct.\n" +
                    "4. Include a brief explanation for why the answer is correct.\n"
                  : "For word search puzzles:\n" +
                    "1. Generate a list of relevant words (max 6 words) and create a grid with those words hidden in it.\n" +
                    "2. Words can be placed horizontally, vertically, or diagonally.\n" +
                    "3. For each word, provide:\n" +
                    "   - A descriptive hint that teaches about the concept\n" +
                    "   - A partial word with some letters replaced by underscores (_)\n" +
                    "4. Make the grid more challenging by:\n" +
                    "   - Using a 10x10 grid\n" +
                    "   - Placing words in all directions\n" +
                    "   - Adding decoy letters strategically\n") +
                "Use the provided context to create accurate and engaging puzzles. Always respond with valid JSON that matches the requested structure exactly.",
            },
            {
              role: "user",
              content: promptData.prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        });

        const puzzleContent = response.choices[0]?.message?.content;
        if (!puzzleContent) {
          throw new Error("No content in response from OpenAI");
        }

        return JSON.parse(puzzleContent);
      }
    } catch (error) {
      console.error(`[OpenAI Generate] Attempt ${attempt + 1} failed:`, error);
      attempt++;

      if (attempt === maxRetries) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        throw new Error(
          `Failed to generate valid puzzle after ${maxRetries} attempts: ${errorMessage}`
        );
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}
