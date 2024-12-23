"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSolanaGame } from "@/hooks/useSolanaGame";
import { getUserPoints } from "@/lib/actions/rewards";
import { useAuth } from "@clerk/nextjs";
import { MIN_POINTS_FOR_SOL, SOL_REWARD_AMOUNT } from "@/lib/constants";
import { Progress } from "@/components/ui/progress";

export function SolRewardButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentPoints, setCurrentPoints] = useState(0);
  const { toast } = useToast();
  const { userId } = useAuth();
  const { rewardPlayer, isWalletConnected } = useSolanaGame();

  useEffect(() => {
    const fetchPoints = async () => {
      if (userId) {
        const points = await getUserPoints(userId);
        setCurrentPoints(points);
      }
    };

    fetchPoints();
    
    // Listen for points updates
    const handlePointsUpdate = () => {
      fetchPoints();
    };
    window.addEventListener("points-updated", handlePointsUpdate);
    return () => window.removeEventListener("points-updated", handlePointsUpdate);
  }, [userId]);

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

      // Send SOL reward
      const signature = await rewardPlayer(SOL_REWARD_AMOUNT);
      
      if (signature) {
        toast({
          title: "Reward Claimed!",
          description: `Successfully sent ${SOL_REWARD_AMOUNT} SOL to your wallet!`,
          className: "bg-green-500 text-white",
        });
        
        // Trigger points update
        window.dispatchEvent(new Event("points-updated"));
      }
    } catch (error) {
      console.error("Error claiming reward:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to claim SOL reward. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isWalletConnected) {
    return null;
  }

  const progressPercentage = Math.min((currentPoints / MIN_POINTS_FOR_SOL) * 100, 100);
  const pointsNeeded = Math.max(MIN_POINTS_FOR_SOL - currentPoints, 0);

  return (
    <div className="w-full space-y-2">
      <div className="text-sm text-gray-600 text-center">
        {pointsNeeded > 0 
          ? `${pointsNeeded} more points needed for ${SOL_REWARD_AMOUNT} SOL`
          : `Ready to claim ${SOL_REWARD_AMOUNT} SOL!`}
      </div>
      <Progress value={progressPercentage} className="h-2" />
      <Button
        onClick={handleClaimReward}
        disabled={isLoading || currentPoints < MIN_POINTS_FOR_SOL}
        className="w-full"
      >
        {isLoading ? "Claiming..." : "Claim SOL Reward"}
      </Button>
    </div>
  );
} 