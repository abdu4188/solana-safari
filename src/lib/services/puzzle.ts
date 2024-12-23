import { db } from "@/lib/db";
import { puzzles } from "@/lib/db/schema/resources";
import { EmbeddingSearchResult } from "./embeddings";
import { z } from "zod";

export const generatePuzzleSchema = z.object({
  topic: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  type: z.enum(["wordsearch", "quiz", "riddle", "anagram"]),
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
  grid?: string[][];
  words?: string[];
}

interface WordSearchMetadata {
  generatedBy: string;
  puzzleType: PuzzleInput["type"];
  relevantContent: {
    content: string;
    similarity: number;
    metadata: Record<string, unknown>;
  }[];
  grid?: string[][];
  words?: string[];
}

export interface PuzzleStructure {
  title: string;
  content: string;
  solution: string;
  hints: string[];
  points: number;
  timeLimit: number;
  metadata: {
    category: PuzzleInput["type"];
    topic: string;
    sourceContent: string[];
  };
  grid?: string[][];
  words?: string[];
  preSelectedWords?: string[];
  additionalMetadata?: Record<string, unknown>;
}

export function generatePuzzlePrompt(
  type: PuzzleInput["type"],
  topic: string,
  difficulty: PuzzleInput["difficulty"],
  context: string
): { structure: PuzzleStructure; prompt: string } {
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
    wordsearch: {
      content: "The puzzle question or clue",
      timeLimit: 300,
      grid: [
        ["A", "B"],
        ["C", "D"],
      ], // Example grid structure
      words: ["WORD1", "WORD2"], // Example words to find
      preSelectedWords: [], // Pre-selected words from our tracking system
    },
    quiz: {
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
    anagram: {
      content: "The scrambled word",
      solution: "The unscrambled word",
      points: 100,
      timeLimit: 180,
      additionalMetadata: {
        wordCategories: [
          "Solana-specific terms (e.g., SEALEVEL, GULFSTREAM)",
          "Blockchain concepts (e.g., VALIDATOR, STAKING)",
          "DeFi terms (e.g., SERUM, RAYDIUM)",
          "NFT terms (e.g., METAPLEX, CANDY)",
          "Technical terms (e.g., PROGRAM, ACCOUNT)",
          "Ecosystem projects (e.g., PHANTOM, MAGIC)",
        ],
      },
    },
  };

  const structure = {
    ...baseStructure,
    ...typeSpecificPrompts[type],
  };

  const anagramInstructions =
    type === "anagram"
      ? `
Choose a word from one of the following categories, but DO NOT use common words like "SOLANA" or basic terms. Instead, focus on more specific ecosystem terms:
- Solana-specific technical terms (e.g., SEALEVEL, GULFSTREAM)
- Blockchain validator/staking terms (e.g., VALIDATOR, STAKING)
- DeFi protocols and terms (e.g., SERUM, RAYDIUM)
- NFT-related terms (e.g., METAPLEX, CANDY)
- Technical concepts (e.g., PROGRAM, ACCOUNT)
- Popular ecosystem projects (e.g., PHANTOM, MAGIC)

The word should be:
1. A single word (no spaces)
2. Related to Solana blockchain
3. Between 5-12 letters long
4. Not too obvious or common
5. Properly scrambled in the content field
6. Educational and interesting

Make sure to:
1. Scramble the letters thoroughly in the content field
2. Provide helpful hints that teach about the term's significance
3. Include a brief explanation about the term's significance
`
      : "";

  const prompt = `Use the following context about "${topic}" to create a ${difficulty} ${type}:

Context:
${context}

${anagramInstructions}
Format the response as JSON with the following structure:
${JSON.stringify(structure, null, 2)}`;

  return { structure, prompt };
}

export async function savePuzzle(
  gameId: number,
  puzzleData: PuzzleData,
  type: PuzzleInput["type"],
  difficulty: PuzzleInput["difficulty"],
  relevantContent: EmbeddingSearchResult[]
) {
  const metadata: WordSearchMetadata = {
    generatedBy: "ai",
    puzzleType: type,
    relevantContent: relevantContent.map((item) => ({
      content: item.content,
      similarity: item.similarity,
      metadata: item.metadata,
    })),
  };

  // For word search puzzles, include grid and words in metadata
  if (type === "wordsearch" && puzzleData.grid && puzzleData.words) {
    metadata.grid = puzzleData.grid;
    metadata.words = puzzleData.words;
  }

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
      metadata,
      isActive: true,
    })
    .returning();

  // For word search puzzles, add grid and words to the response
  if (type === "wordsearch" && metadata.grid && metadata.words) {
    return {
      ...savedPuzzle,
      grid: metadata.grid,
      words: metadata.words,
    };
  }

  return savedPuzzle;
}
