import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, SystemProgram, Transaction } from "@solana/web3.js";
import { useState } from "react";

export function useSolanaGame() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  // Function to reward player with SOL
  const rewardPlayer = async (amount: number) => {
    if (!publicKey) {
      throw new Error("Wallet not connected");
    }

    try {
      setIsLoading(true);

      // Check wallet balance
      const walletBalance = await connection.getBalance(publicKey);
      const requiredAmount = amount * LAMPORTS_PER_SOL;

      if (walletBalance < requiredAmount) {
        throw new Error("Insufficient funds in your wallet");
      }

      // Create a transaction to send SOL to yourself (this will be used to track rewards)
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
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

  return {
    isLoading,
    rewardPlayer,
    getPlayerBalance,
    isWalletConnected: !!publicKey,
    playerAddress: publicKey?.toString(),
  };
}
