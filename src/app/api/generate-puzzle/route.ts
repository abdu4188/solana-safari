import { NextResponse } from "next/server";
import {
  generatePuzzleSchema,
  generatePuzzlePrompt,
  savePuzzle,
  PuzzleInput,
} from "@/lib/services/puzzle";
import { generatePuzzleWithAI } from "@/lib/services/openai";
import Logger from "@/lib/logger";
import { kv } from "@vercel/kv";
import { nanoid } from "nanoid";

export const runtime = "nodejs";

const PUZZLE_CACHE_KEY = "puzzle_cache";
const MIN_CACHE_SIZE = 3; // Minimum number of puzzles to keep in cache

interface CachedPuzzle {
  id: number;
  gameId: number;
  title: string;
  content: string;
  solution: string;
  difficulty: PuzzleInput["difficulty"];
  hints: string[];
  timeLimit: number;
  points: number;
  metadata: {
    grid: string[][];
    words: string[];
    generatedBy: string;
    puzzleType: PuzzleInput["type"];
    [key: string]: unknown;
  };
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

// Function to get a puzzle from cache
async function getFromCache(): Promise<CachedPuzzle | null> {
  const cache = await kv.lrange(PUZZLE_CACHE_KEY, 0, 0);
  if (cache && cache.length > 0) {
    // Remove the used puzzle from the cache
    await kv.lpop(PUZZLE_CACHE_KEY);
    return JSON.parse(cache[0]);
  }
  return null;
}

// Function to add a puzzle to cache
async function addToCache(puzzle: CachedPuzzle): Promise<void> {
  await kv.rpush(PUZZLE_CACHE_KEY, JSON.stringify(puzzle));
}

// Background function to maintain the cache
async function maintainCache() {
  try {
    const cacheSize = await kv.llen(PUZZLE_CACHE_KEY);
    if (cacheSize < MIN_CACHE_SIZE) {
      // Generate new puzzles in the background
      const numToGenerate = MIN_CACHE_SIZE - cacheSize;
      for (let i = 0; i < numToGenerate; i++) {
        generatePuzzleAsync(
          nanoid(),
          "Solana blockchain",
          "medium",
          "wordsearch",
          1,
          true
        );
        // Add a small delay between generations to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  } catch (error) {
    Logger.error("api", "Error maintaining puzzle cache", { error });
  }
}

export async function POST(req: Request) {
  Logger.info("api", "Received puzzle generation request");
  try {
    const body = await req.json();
    const { topic, difficulty, type, gameId } =
      generatePuzzleSchema.parse(body);

    // Try to get a pre-generated puzzle from cache
    const cachedPuzzle = await getFromCache();
    if (cachedPuzzle) {
      Logger.info("api", "Using cached puzzle");
      // Trigger cache maintenance in the background
      maintainCache();
      return NextResponse.json({
        success: true,
        puzzle: cachedPuzzle,
      });
    }

    // If no cached puzzle available, generate one synchronously
    Logger.info("api", "No cached puzzle available, generating new one");
    const puzzleId = nanoid();

    // Store initial status
    await kv.set(`puzzle:${puzzleId}`, {
      status: "pending",
      puzzle: null,
      error: null,
    });

    // Start generation
    generatePuzzleAsync(puzzleId, topic, difficulty, type, gameId, false);

    return NextResponse.json({
      success: true,
      puzzle: { id: puzzleId },
    });
  } catch (error) {
    Logger.error("api", "Error in puzzle generation request", { error });
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to start puzzle generation",
      },
      { status: 500 }
    );
  }
}

async function generatePuzzleAsync(
  puzzleId: string,
  topic: string,
  difficulty: PuzzleInput["difficulty"],
  type: PuzzleInput["type"],
  gameId: number,
  forCache: boolean = false
) {
  try {
    // Generate the prompt based on puzzle type
    Logger.info("api", "Generating puzzle prompt", { type, topic, difficulty });
    const promptData = generatePuzzlePrompt(type, topic, difficulty, "");

    // Generate puzzle using AI
    Logger.info("api", "Requesting puzzle generation from AI");
    const puzzleData = await generatePuzzleWithAI(promptData);

    // Save to database
    Logger.info("api", "Saving puzzle to database");
    const savedPuzzle = await savePuzzle(
      gameId,
      puzzleData,
      type,
      difficulty,
      [] // Empty relevant content for word search puzzles
    );

    if (forCache) {
      // Add to cache for future use
      await addToCache(savedPuzzle as CachedPuzzle);
    } else {
      // Update status in KV store for immediate use
      await kv.set(`puzzle:${puzzleId}`, {
        status: "completed",
        puzzle: savedPuzzle,
        error: null,
      });
    }
  } catch (error) {
    Logger.error("api", "Error in async puzzle generation", { error });
    if (!forCache) {
      // Only update status if not generating for cache
      await kv.set(`puzzle:${puzzleId}`, {
        status: "error",
        puzzle: null,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error in puzzle generation",
      });
    }
  }
}
