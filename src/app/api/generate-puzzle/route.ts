import { NextResponse } from "next/server";
import {
  generatePuzzleSchema,
  generatePuzzlePrompt,
  savePuzzle,
} from "@/lib/services/puzzle";
import { getEmbedding, generatePuzzleWithAI } from "@/lib/services/openai";
import { searchSimilarContent } from "@/lib/services/embeddings";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topic, difficulty, type, gameId } =
      generatePuzzleSchema.parse(body);

    // Get embedding for the topic
    const topicEmbedding = await getEmbedding(topic);

    // Search for relevant content
    const relevantContent = await searchSimilarContent(topicEmbedding);

    // Create a context from relevant content
    const context =
      relevantContent.length > 0
        ? relevantContent.map((item) => item.content).join("\n\n")
        : `No specific context found for ${topic}. Generate a puzzle based on general knowledge.`;

    // Generate the prompt based on puzzle type
    const prompt = generatePuzzlePrompt(type, topic, difficulty, context);

    // Generate puzzle using AI
    const puzzleData = await generatePuzzleWithAI(prompt);

    // Save to database
    const savedPuzzle = await savePuzzle(
      gameId,
      puzzleData,
      type,
      difficulty,
      relevantContent
    );

    return NextResponse.json({
      success: true,
      puzzle: savedPuzzle,
    });
  } catch (error) {
    console.error("Error generating puzzle:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to generate puzzle",
      },
      { status: 500 }
    );
  }
}
