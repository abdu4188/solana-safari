import { NextResponse } from "next/server";
import {
  generatePuzzleSchema,
  generatePuzzlePrompt,
  savePuzzle,
  PuzzleType,
  PuzzleInput,
} from "@/lib/services/puzzle";
import { getEmbedding, generatePuzzleWithAI } from "@/lib/services/openai";
import { searchSimilarContent } from "@/lib/services/embeddings";
import Logger from "@/lib/logger";
import { kv } from "@vercel/kv";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  Logger.info("api", "Received puzzle generation request");
  try {
    const body = await req.json();
    const { topic, difficulty, type, gameId } =
      generatePuzzleSchema.parse(body);

    // Generate a unique ID for this puzzle generation request
    const puzzleId = nanoid();

    // Store initial status in KV
    await kv.set(`puzzle:${puzzleId}`, {
      status: "processing",
      createdAt: Date.now(),
    });

    // Start the generation process in the background
    generatePuzzleInBackground(
      puzzleId,
      topic,
      difficulty,
      type as PuzzleType,
      gameId
    );

    // Return immediately with the puzzle ID
    return NextResponse.json({
      success: true,
      puzzleId,
      status: "processing",
    });
  } catch (error) {
    Logger.error("api", "Error initiating puzzle generation", { error });
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to initiate puzzle generation",
      },
      { status: 500 }
    );
  }
}

async function generatePuzzleInBackground(
  puzzleId: string,
  topic: string,
  difficulty: PuzzleInput["difficulty"],
  type: PuzzleType,
  gameId: number
) {
  try {
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

    // Update KV with completed puzzle
    await kv.set(`puzzle:${puzzleId}`, {
      status: "completed",
      puzzle: savedPuzzle,
      completedAt: Date.now(),
    });
  } catch (error) {
    Logger.error("api", "Error generating puzzle in background", { error });
    // Update KV with error status
    await kv.set(`puzzle:${puzzleId}`, {
      status: "error",
      error:
        error instanceof Error ? error.message : "Failed to generate puzzle",
      completedAt: Date.now(),
    });
  }
}
