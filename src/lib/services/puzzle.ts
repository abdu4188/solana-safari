import { db } from "@/lib/db";
import { puzzles } from "@/lib/db/schema/resources";
import { EmbeddingSearchResult } from "./embeddings";
import { z } from "zod";

export const generatePuzzleSchema = z.object({
  topic: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  type: z.enum(["word-puzzle", "trivia", "riddle"]),
  gameId: z.number(),
});

export type PuzzleInput = z.infer<typeof generatePuzzleSchema>;

interface PuzzleData {
  title: string;
  content: string;
  solution: string;
  hints: string[];
  timeLimit: number;
  points: number;
  metadata: Record<string, unknown>;
}

export function generatePuzzlePrompt(
  type: PuzzleInput["type"],
  topic: string,
  difficulty: PuzzleInput["difficulty"],
  context: string
): string {
  const baseStructure = {
    title: "A catchy title for the puzzle",
    content: "The puzzle content",
    solution: "The correct answer",
    hints: ["Hint 1", "Hint 2"],
    points: 100,
    timeLimit: 300,
    metadata: {
      category: type,
      topic: topic,
      sourceContent: ["id1", "id2"],
    },
  };

  const typeSpecificPrompts = {
    "word-puzzle": {
      content: "The puzzle question or clue",
      timeLimit: 300,
    },
    trivia: {
      content: "The trivia question with multiple choice options (A, B, C, D)",
      timeLimit: 60,
      additionalMetadata: {
        options: {
          A: "Option A text",
          B: "Option B text",
          C: "Option C text",
          D: "Option D text",
        },
      },
    },
    riddle: {
      content: "The riddle text",
      points: 150,
      timeLimit: 300,
    },
  };

  const structure = {
    ...baseStructure,
    ...typeSpecificPrompts[type],
  };

  return `Use the following context about "${topic}" to create a ${difficulty} ${type}:

Context:
${context}

Format the response as JSON with the following structure:
${JSON.stringify(structure, null, 2)}`;
}

export async function savePuzzle(
  gameId: number,
  puzzleData: PuzzleData,
  type: PuzzleInput["type"],
  difficulty: PuzzleInput["difficulty"],
  relevantContent: EmbeddingSearchResult[]
) {
  const [savedPuzzle] = await db
    .insert(puzzles)
    .values({
      gameId,
      title: puzzleData.title,
      content: puzzleData.content,
      solution: puzzleData.solution,
      difficulty,
      hints: puzzleData.hints,
      timeLimit: puzzleData.timeLimit,
      points: puzzleData.points,
      metadata: {
        ...puzzleData.metadata,
        generatedBy: "ai",
        puzzleType: type,
        relevantContent: relevantContent.map((item) => ({
          content: item.content,
          similarity: item.similarity,
          metadata: item.metadata,
        })),
      },
      isActive: true,
    })
    .returning();

  return savedPuzzle;
}
