import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

export async function generatePuzzleWithAI(prompt: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "You are a puzzle generator that creates educational puzzles about blockchain and cryptocurrency topics. Use the provided context to create accurate and engaging puzzles. Always respond with valid JSON that matches the requested structure exactly.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 500,
  });

  const puzzleContent = response.choices[0]?.message?.content;
  if (!puzzleContent) {
    throw new Error("Failed to generate puzzle content");
  }

  return JSON.parse(puzzleContent);
}
