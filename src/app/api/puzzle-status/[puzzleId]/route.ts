import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

interface PuzzleType {
  id: string;
  content: string;
  solution: string;
  type: string;
  difficulty: string;
  points: number;
  hints?: string[];
  explanation?: string;
}

interface PuzzleStatus {
  status: "pending" | "completed" | "error";
  puzzle: PuzzleType | null;
  error: string | null;
}

export async function GET(request: Request) {
  try {
    // Extract puzzleId from URL
    const puzzleId = request.url.split("/").pop();

    if (!puzzleId) {
      return NextResponse.json(
        { error: "Puzzle ID is required" },
        { status: 400 }
      );
    }

    // Try to get puzzle status from KV store
    const puzzleStatus = await kv.get<PuzzleStatus>(`puzzle:${puzzleId}`);

    if (!puzzleStatus) {
      // If no status found, check if it's a completed puzzle in the database
      const puzzle = await kv.get(`puzzle_db:${puzzleId}`);
      if (puzzle) {
        return NextResponse.json({
          status: "completed",
          puzzle,
          error: null,
        } as PuzzleStatus);
      }
      return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
    }

    // If the puzzle is completed, cache it in the database for faster retrieval
    if (puzzleStatus.status === "completed" && puzzleStatus.puzzle) {
      await kv.set(`puzzle_db:${puzzleId}`, puzzleStatus.puzzle);
      // Clean up the temporary status
      await kv.del(`puzzle:${puzzleId}`);
    }

    return NextResponse.json(puzzleStatus);
  } catch (error: unknown) {
    console.error("Error fetching puzzle status:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
