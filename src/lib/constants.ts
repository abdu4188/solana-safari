export const SOLANA_TOPICS = [
  "Proof of History",
  "Solana Programs",
  "Solana Architecture",
  "Solana Tokenomics",
  "Solana Consensus",
  "Solana DeFi",
  "Solana NFTs",
  "Solana Security",
  "Solana Scalability",
  "Solana Development",
];

// SOL Reward Configuration
export const POINTS_TO_SOL_RATIO = 2000; // 2000 points = 0.005 SOL
export const MIN_POINTS_FOR_SOL = 10000; // Minimum points needed to claim SOL
export const SOL_REWARD_AMOUNT = 0.005; // Amount of SOL to reward (in SOL)
export const GAME_TREASURY_KEY = process.env.NEXT_PUBLIC_GAME_TREASURY_KEY || ""; // Treasury public key
