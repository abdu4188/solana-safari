import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import Logger from "@/lib/logger";

export const runtime = "edge";

export async function GET(
  request: Request,
  { params }: { params: { puzzleId: string } }
) {
  try {
    const { puzzleId } = params;
    const puzzleStatus = await kv.get(`puzzle:${puzzleId}`);

    if (!puzzleStatus) {
      return NextResponse.json({ error: "Puzzle not found" }, { status: 404 });
    }

    return NextResponse.json(puzzleStatus);
  } catch (error) {
    Logger.error("api", "Error fetching puzzle status", { error });
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch puzzle status",
      },
      { status: 500 }
    );
  }
}
