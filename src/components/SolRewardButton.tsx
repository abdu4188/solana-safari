"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSolanaGame } from "@/hooks/useSolanaGame";
import { getUserPoints } from "@/lib/actions/rewards";
import { useAuth } from "@clerk/nextjs";
import { MIN_POINTS_FOR_SOL, SOL_REWARD_AMOUNT } from "@/lib/constants";

export function SolRewardButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { userId } = useAuth();
  const { rewardPlayer, isWalletConnected } = useSolanaGame();

  const handleClaimReward = async () => {
    if (!userId || !isWalletConnected) return;

    try {
      setIsLoading(true);
      
      // Check user's points
      const points = await getUserPoints(userId);
      
      if (points < MIN_POINTS_FOR_SOL) {
        toast({
          variant: "destructive",
          title: "Not enough points",
          description: `You need ${MIN_POINTS_FOR_SOL} points to claim SOL rewards. You have ${points} points.`,
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

  return (
    <Button
      onClick={handleClaimReward}
      disabled={isLoading}
      className="w-full mt-2"
    >
      {isLoading ? "Claiming..." : "Claim SOL Reward"}
    </Button>
  );
} 