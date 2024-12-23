import { NextResponse } from "next/server";
import {
  generatePuzzleSchema,
  generatePuzzlePrompt,
  savePuzzle,
} from "@/lib/services/puzzle";
import { getEmbedding, generatePuzzleWithAI } from "@/lib/services/openai";
import { searchSimilarContent } from "@/lib/services/embeddings";
import Logger from "@/lib/logger";

export async function POST(req: Request) {
  Logger.info("api", "Received puzzle generation request");
  try {
    const body = await req.json();
    const { topic, difficulty, type, gameId } =
      generatePuzzleSchema.parse(body);

    Logger.info("api", "Processing puzzle generation request", {
      topic,
      difficulty,
      type,
      gameId,
    });

    // Get embedding for the topic
    Logger.info("ai", "Generating embedding for topic", { topic });
    const topicEmbedding = await getEmbedding(topic);

    // Search for relevant content
    Logger.info("ai", "Searching for relevant content");
    const relevantContent = await searchSimilarContent(topicEmbedding);
    Logger.info("ai", "Found relevant content", {
      count: relevantContent.length,
    });

    // Create a context from relevant content
    const context =
      relevantContent.length > 0
        ? relevantContent.map((item) => item.content).join("\n\n")
        : `No specific context found for ${topic}. Generate a puzzle based on general knowledge.`;

    // Generate the prompt based on puzzle type
    Logger.info("ai", "Generating puzzle prompt", { type, topic, difficulty });
    const promptData = generatePuzzlePrompt(type, topic, difficulty, context);

    // Generate puzzle using AI
    Logger.info("ai", "Requesting puzzle generation from AI");
    const puzzleData = await generatePuzzleWithAI(promptData);

    // Save to database
    Logger.info("api", "Saving puzzle to database");
    const savedPuzzle = await savePuzzle(
      gameId,
      puzzleData,
      type,
      difficulty,
      relevantContent
    );

    Logger.info("api", "Successfully generated and saved puzzle", {
      puzzleId: savedPuzzle.id,
    });

    return NextResponse.json({
      success: true,
      puzzle: savedPuzzle,
    });
  } catch (error) {
    Logger.error("api", "Error generating puzzle", { error });
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate puzzle",
      },
      { status: 500 }
    );
  }
}
