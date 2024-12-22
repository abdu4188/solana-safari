"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useSolanaGame } from "../hooks/useSolanaGame";
import { useEffect, useState } from "react";
import { UserPoints } from "./UserPoints";
import { onPointsUpdated } from "@/lib/events";

export function SolanaWalletButton() {
  const { isWalletConnected, getPlayerBalance } = useSolanaGame();
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBalance = async () => {
    if (isWalletConnected) {
      const bal = await getPlayerBalance();
      setBalance(bal);
    }
  };

  useEffect(() => {
    setIsLoading(false);
    fetchBalance();

    // Listen for point updates to refresh balance
    const cleanup = onPointsUpdated(() => {
      fetchBalance();
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
          <div className="text-sm text-gray-600">
            Balance: {balance.toFixed(4)} SOL
          </div>
          <UserPoints />
        </div>
      )}
    </div>
  );
}
