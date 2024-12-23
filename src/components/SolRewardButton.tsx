"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSolanaGame } from "@/hooks/useSolanaGame";
import { getUserPoints, resetPoints } from "@/lib/actions/rewards";
import { useAuth } from "@clerk/nextjs";
import { MIN_POINTS_FOR_SOL, SOL_REWARD_AMOUNT } from "@/lib/constants";
import { Progress } from "@/components/ui/progress";

export function SolRewardButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentPoints, setCurrentPoints] = useState(0);
  const { toast } = useToast();
  const { userId } = useAuth();
  const { rewardPlayer, isWalletConnected, getPlayerBalance } = useSolanaGame();
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    const fetchPoints = async () => {
      if (userId) {
        const points = await getUserPoints(userId);
        setCurrentPoints(points);
      }
    };

    const fetchBalance = async () => {
      if (isWalletConnected) {
        const balance = await getPlayerBalance();
        setWalletBalance(balance);
      }
    };

    fetchPoints();
    fetchBalance();

    // Listen for points updates
    const handlePointsUpdate = () => {
      fetchPoints();
      fetchBalance();
    };
    window.addEventListener("points-updated", handlePointsUpdate);
    return () =>
      window.removeEventListener("points-updated", handlePointsUpdate);
  }, [userId, isWalletConnected, getPlayerBalance]);

  const handleClaimReward = async () => {
    if (!userId || !isWalletConnected) return;

    try {
      setIsLoading(true);

      if (currentPoints < MIN_POINTS_FOR_SOL) {
        toast({
          variant: "destructive",
          title: "Not enough points",
          description: `You need ${MIN_POINTS_FOR_SOL} points to claim SOL rewards. You have ${currentPoints} points.`,
        });
        return;
      }

      if (walletBalance < SOL_REWARD_AMOUNT) {
        toast({
          variant: "destructive",
          title: "Insufficient balance",
          description: `You need at least ${SOL_REWARD_AMOUNT} SOL in your wallet to process the reward.`,
        });
        return;
      }

      // Send SOL reward
      const signature = await rewardPlayer(SOL_REWARD_AMOUNT);

      if (signature) {
        // Reset points after successful reward
        const resetResult = await resetPoints(userId, currentPoints);

        if (resetResult.success) {
          toast({
            title: "Reward Processed!",
            description: `Successfully processed ${SOL_REWARD_AMOUNT} SOL reward and reset points!`,
            className: "bg-green-500 text-white",
          });

          // Trigger points update
          window.dispatchEvent(new Event("points-updated"));
        } else {
          toast({
            variant: "destructive",
            title: "Warning",
            description:
              "SOL reward processed but failed to reset points. Please contact support.",
          });
        }
      }
    } catch (error) {
      console.error("Error claiming reward:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to process SOL reward. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isWalletConnected) {
    return null;
  }

  const progressPercentage = Math.min(
    (currentPoints / MIN_POINTS_FOR_SOL) * 100,
    100
  );
  const pointsNeeded = Math.max(MIN_POINTS_FOR_SOL - currentPoints, 0);

  return (
    <div className="w-full space-y-2">
      <div className="text-sm text-white text-center">
        {pointsNeeded > 0
          ? `${pointsNeeded} more points needed for ${SOL_REWARD_AMOUNT} SOL`
          : `Ready to process ${SOL_REWARD_AMOUNT} SOL reward!`}
      </div>
      <Progress value={progressPercentage} className="h-2" />
      <Button
        onClick={handleClaimReward}
        disabled={
          isLoading ||
          currentPoints < MIN_POINTS_FOR_SOL ||
          walletBalance < SOL_REWARD_AMOUNT
        }
        className={`w-full ${
          isLoading ||
          currentPoints < MIN_POINTS_FOR_SOL ||
          walletBalance < SOL_REWARD_AMOUNT
            ? "bg-gray-500 text-white"
            : ""
        }`}
      >
        {isLoading ? "Processing..." : "Process SOL Reward"}
      </Button>
    </div>
  );
}
