import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { useState } from "react";

export function useSolanaGame() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  // Function to reward player with SOL (for testing, use small amounts on devnet)
  const rewardPlayer = async (amount: number) => {
    if (!publicKey) return;

    try {
      setIsLoading(true);
      // For this example, we'll send from a game treasury account
      // In production, you should use a proper game treasury with secure key management
      const GAME_TREASURY = new PublicKey("YOUR_TREASURY_PUBLIC_KEY");

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: GAME_TREASURY,
          toPubkey: publicKey,
          lamports: amount * LAMPORTS_PER_SOL,
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
