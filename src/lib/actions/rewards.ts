"use server";

import { db } from "@/lib/db";
import { rewards } from "@/lib/db/schema/resources";
import { sql } from "drizzle-orm";
import { emitPointsUpdated } from "@/lib/events";

export const createReward = async ({
  userId,
  puzzleId,
  tokenType,
  tokenAmount,
  reason,
}: {
  userId: string;
  puzzleId: number;
  tokenType: string;
  tokenAmount: number;
  reason: string;
}) => {
  try {
    const [reward] = await db
      .insert(rewards)
      .values({
        userId,
        puzzleId,
        tokenType,
        tokenAmount,
        reason,
        metadata: {},
      })
      .returning();

    // Emit event for client-side updates
    emitPointsUpdated();

    return { success: true, reward };
  } catch (error) {
    console.error("Error creating reward:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create reward",
    };
  }
};

export const getUserPoints = async (userId: string) => {
  try {
    const result = await db
      .select({
        totalPoints: sql<number>`sum(${rewards.tokenAmount})`,
      })
      .from(rewards)
      .where(
        sql`${rewards.userId} = ${userId} AND ${rewards.tokenType} = 'points'`
      );

    return result[0]?.totalPoints || 0;
  } catch (error) {
    console.error("Error getting user points:", error);
    return 0;
  }
};
