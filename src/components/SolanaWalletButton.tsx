"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useSolanaGame } from "../hooks/useSolanaGame";
import { useEffect, useState } from "react";
import { UserPoints } from "./UserPoints";
import { onPointsUpdated } from "@/lib/events";
import { SolRewardButton } from "./SolRewardButton";

export function SolanaWalletButton() {
  const { isWalletConnected, getPlayerBalance } = useSolanaGame();
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    setIsLoading(false);

    // Listen for point updates to refresh balance
    const cleanup = onPointsUpdated(() => {
    });
    return cleanup;
  }, [isWalletConnected, getPlayerBalance]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="h-[36px] w-[180px] animate-pulse bg-secondary rounded-md" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <WalletMultiButton />
      {isWalletConnected && (
        <div className="flex flex-col items-center gap-1">
          <UserPoints />
          <SolRewardButton />
        </div>
      )}
      {balance && (
        <div className="text-sm text-muted-foreground mt-2">
          Balance: {balance} SOL
        </div>
      )}
    </div>
  );
}
