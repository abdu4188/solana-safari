import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { useState } from "react";
import { GAME_TREASURY_KEY } from "@/lib/constants";

export function useSolanaGame() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  // Function to reward player with SOL
  const rewardPlayer = async (amount: number) => {
    if (!publicKey) {
      throw new Error("Wallet not connected");
    }

    if (!GAME_TREASURY_KEY) {
      throw new Error("Game treasury not configured. Please add NEXT_PUBLIC_GAME_TREASURY_KEY to your environment variables.");
    }

    try {
      setIsLoading(true);
      const treasuryPublicKey = new PublicKey(GAME_TREASURY_KEY);

      // Check treasury balance
      const treasuryBalance = await connection.getBalance(treasuryPublicKey);
      const requiredAmount = amount * LAMPORTS_PER_SOL;

      if (treasuryBalance < requiredAmount) {
        throw new Error("Insufficient funds in treasury wallet");
      }

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: treasuryPublicKey,
          toPubkey: publicKey,
          lamports: requiredAmount,
        })
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, "confirmed");

      return signature;
    } catch (error) {
      console.error("Error rewarding player:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to check player's SOL balance
  const getPlayerBalance = async () => {
    if (!publicKey) return 0;
    try {
      const balance = await connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error("Error getting balance:", error);
      return 0;
    }
  };

  // Function to check treasury balance
  const getTreasuryBalance = async () => {
    if (!GAME_TREASURY_KEY) return 0;
    try {
      const treasuryPublicKey = new PublicKey(GAME_TREASURY_KEY);
      const balance = await connection.getBalance(treasuryPublicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error("Error getting treasury balance:", error);
      return 0;
    }
  };

  return {
    isLoading,
    rewardPlayer,
    getPlayerBalance,
    getTreasuryBalance,
    isWalletConnected: !!publicKey,
    playerAddress: publicKey?.toString(),
    isTreasuryConfigured: !!GAME_TREASURY_KEY,
  };
}
