import OpenAI from "openai";
import {
  getRandomWords,
  trackQuizQuestion,
  isQuizRecentlyUsed,
} from "@/lib/api";
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
  try {
    // For word search puzzles, get pre-selected words using our tracking system
    const puzzleType = promptData.structure.metadata.category;
    let preSelectedWords: string[] = [];
    if (puzzleType === "wordsearch") {
      const terms = await getRandomWords(6);
      preSelectedWords = terms.map((term) => term.term);
      // Modify the structure to use our pre-selected words
      promptData.structure.preSelectedWords = preSelectedWords;
    }

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
                (puzzleType === "wordsearch"
                  ? "1. Use ONLY the pre-selected words provided in the prompt.\n" +
                    "2. Create a grid with those words hidden in it.\n"
                  : "1. Generate a list of relevant words (max 6 words) and create a grid with those words hidden in it.\n") +
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
      console.error("[OpenAI Generate] No content in response");
      throw new Error("Failed to generate puzzle content");
    }

    console.log("[OpenAI Generate] Raw response:", puzzleContent);

    try {
      const parsedContent = JSON.parse(puzzleContent);
      console.log("[OpenAI Generate] Successfully parsed response");

      // For quiz puzzles, check if the question has been recently used
      if (puzzleType === "quiz") {
        if (isQuizRecentlyUsed(parsedContent.content, parsedContent.solution)) {
          console.log(
            "[OpenAI Generate] Quiz question was recently used, generating a new one"
          );
          return generatePuzzleWithAI(promptData); // Recursively try again
        }
        // Track the new quiz question
        await trackQuizQuestion(parsedContent.content, parsedContent.solution);
      }
      // For word search puzzles, ensure the grid and words are properly formatted
      else if (puzzleType === "wordsearch") {
        if (
          !Array.isArray(parsedContent.grid) ||
          !Array.isArray(parsedContent.words)
        ) {
          console.error(
            "[OpenAI Generate] Invalid word search format:",
            parsedContent
          );
          throw new Error(
            "Invalid word search puzzle format - missing grid or words"
          );
        }

        // Validate grid structure
        if (
          !parsedContent.grid.every(
            (row: unknown) =>
              Array.isArray(row) &&
              row.every((cell: unknown) => typeof cell === "string")
          )
        ) {
          throw new Error(
            "Invalid grid format - must be array of string arrays"
          );
        }

        // Validate words
        if (
          !parsedContent.words.every(
            (word: unknown) => typeof word === "string"
          )
        ) {
          throw new Error("Invalid words format - must be array of strings");
        }
      }

      return parsedContent;
    } catch (parseError) {
      console.error("[OpenAI Generate] Failed to parse response:", parseError);
      throw new Error("Failed to parse puzzle content");
    }
  } catch (error) {
    console.error("[OpenAI Generate] Error generating puzzle:", error);
    throw error;
  }
}
