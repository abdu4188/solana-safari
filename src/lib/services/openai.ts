import OpenAI from "openai";

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

export async function generatePuzzleWithAI(prompt: string) {
  console.log(
    "[OpenAI Generate] Requesting puzzle generation with prompt:",
    prompt.substring(0, 100) + "..."
  );
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a puzzle generator that creates educational puzzles about blockchain and cryptocurrency topics. For word search puzzles:\n" +
            "1. Generate a list of relevant words (max 6 words) and create a grid with those words hidden in it.\n" +
            "2. Words can be placed horizontally, vertically, or diagonally.\n" +
            "3. For each word, provide:\n" +
            "   - A descriptive hint that teaches about the concept\n" +
            "   - A partial word with some letters replaced by underscores (_)\n" +
            "4. Make the grid more challenging by:\n" +
            "   - Using a 10x10 grid\n" +
            "   - Placing words in all directions\n" +
            "   - Adding decoy letters strategically\n" +
            "Use the provided context to create accurate and engaging puzzles. Always respond with valid JSON that matches the requested structure exactly. Include grid, words, hints, and partialWords arrays in the response.",
        },
        {
          role: "user",
          content: prompt,
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

      // For word search puzzles, ensure the grid and words are properly formatted
      if (parsedContent.metadata?.category === "wordsearch") {
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
