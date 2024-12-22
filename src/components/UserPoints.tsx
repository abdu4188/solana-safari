"use client";

import { useEffect, useCallback, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { getUserPoints } from "@/lib/actions/rewards";
import { POINTS_UPDATED_EVENT } from "@/lib/events";

export function UserPoints() {
  const { userId } = useAuth();
  const [points, setPoints] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPoints = useCallback(async () => {
    if (!userId) return;
    try {
      const totalPoints = await getUserPoints(userId);
      setPoints(totalPoints);
    } catch (error) {
      console.error("Error fetching points:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPoints();

    // Add event listener for points updates
    const handlePointsUpdate = () => {
      fetchPoints();
    };

    window.addEventListener(POINTS_UPDATED_EVENT, handlePointsUpdate);
    return () => {
      window.removeEventListener(POINTS_UPDATED_EVENT, handlePointsUpdate);
    };
  }, [fetchPoints]);

  if (isLoading || !userId) {
    return null;
  }

  return <div className="text-sm text-gray-600">Points: {points}</div>;
}
