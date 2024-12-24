import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import Logger from "@/lib/logger";

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

    const puzzleStatus = await kv.get(`puzzle:${puzzleId}`);

    if (!puzzleStatus) {
      return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
    }

    return NextResponse.json(puzzleStatus);
  } catch (error) {
    Logger.error("api", "Error fetching puzzle status", { error });
    return NextResponse.json(
      { error: "Failed to fetch puzzle status" },
      { status: 500 }
    );
  }
}
