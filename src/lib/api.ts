export interface SolanaTerm {
  term: string;
  description: string;
  category: "Core" | "Technical" | "Tool" | "Network" | "DeFi";
  difficulty: "beginner" | "intermediate" | "advanced";
  hint: string;
}

const SOLANA_TERMS: SolanaTerm[] = [
  // Existing terms omitted for brevity

  // Beginner Terms
  {
    term: "TRANSACTION",
    description:
      "A record of a transfer of SOL or execution of a program on Solana",
    category: "Core",
    difficulty: "beginner",
    hint: "The smallest unit of interaction on the blockchain",
  },
  {
    term: "DEFI",
    description:
      "Decentralized Finance - financial applications built on blockchain",
    category: "Core",
    difficulty: "beginner",
    hint: "Finance without traditional banks",
  },
  {
    term: "NFT",
    description:
      "Non-Fungible Token - A unique digital asset stored on the blockchain",
    category: "Core",
    difficulty: "beginner",
    hint: "A digital collectible or piece of art",
  },
  {
    term: "DAPP",
    description:
      "Decentralized Application - A program that runs on a blockchain",
    category: "Core",
    difficulty: "beginner",
    hint: "Think of it as apps, but decentralized!",
  },

  // Intermediate Terms
  {
    term: "TOKEN",
    description: "A digital asset issued on a blockchain",
    category: "Core",
    difficulty: "intermediate",
    hint: "Represents value or utility within a blockchain ecosystem",
  },
  {
    term: "VALIDATOR",
    description: "A node that validates transactions on the blockchain",
    category: "Technical",
    difficulty: "intermediate",
    hint: "Similar to miners in proof-of-work systems",
  },
  {
    term: "RPC",
    description: "Remote Procedure Call - Used to interact with Solana nodes",
    category: "Technical",
    difficulty: "intermediate",
    hint: "How applications talk to the blockchain",
  },
  {
    term: "TURBINE",
    description: "Solana's protocol for efficient block propagation",
    category: "Technical",
    difficulty: "intermediate",
    hint: "A crucial part of Solana's scalability",
  },
  {
    term: "STAKE",
    description:
      "The process of delegating SOL to validators to secure the network",
    category: "Core",
    difficulty: "intermediate",
    hint: "Earn rewards by locking up your SOL",
  },

  // Advanced Terms
  {
    term: "SEALEVEL",
    description:
      "Solana's parallel processing engine for executing smart contracts",
    category: "Technical",
    difficulty: "advanced",
    hint: "Solana's secret sauce for scalability",
  },
  {
    term: "GULF STREAM",
    description: "Solana's mempool-less transaction forwarding protocol",
    category: "Technical",
    difficulty: "advanced",
    hint: "Enables fast confirmation of transactions",
  },
  {
    term: "BPF",
    description:
      "Berkeley Packet Filter - The runtime Solana uses for programs",
    category: "Technical",
    difficulty: "advanced",
    hint: "The execution environment for Solana programs",
  },
  {
    term: "QUANTUM PROOF",
    description:
      "Solana's cryptographic standards designed to resist quantum attacks",
    category: "Technical",
    difficulty: "advanced",
    hint: "Future-proofing Solana's security",
  },
  {
    term: "ATOMIC SWAP",
    description: "A cross-chain transaction mechanism without intermediaries",
    category: "DeFi",
    difficulty: "advanced",
    hint: "Enables trading tokens between chains seamlessly",
  },

  // Ecosystem and Tools
  {
    term: "SOLSCAN",
    description: "A blockchain explorer for Solana",
    category: "Tool",
    difficulty: "beginner",
    hint: "Like Etherscan, but for Solana",
  },
  {
    term: "RAYDIUM",
    description:
      "An automated market maker (AMM) and liquidity provider on Solana",
    category: "DeFi",
    difficulty: "intermediate",
    hint: "A DEX leveraging Serum's order book",
  },
  {
    term: "ORCA",
    description: "A user-friendly decentralized exchange on Solana",
    category: "DeFi",
    difficulty: "beginner",
    hint: "A whale of an exchange, but small enough to be user-friendly",
  },
  {
    term: "SPL-GOVERNANCE",
    description: "A governance framework for managing Solana projects",
    category: "Tool",
    difficulty: "advanced",
    hint: "For on-chain governance and voting",
  },
  {
    term: "PARCL",
    description: "A real-estate investment platform powered by Solana",
    category: "Tool",
    difficulty: "intermediate",
    hint: "Think real estate meets DeFi on Solana",
  },
];

export async function getRandomWord(): Promise<SolanaTerm> {
  const randomIndex = Math.floor(Math.random() * SOLANA_TERMS.length);
  return SOLANA_TERMS[randomIndex];
}

export async function getRandomWords(count: number = 4): Promise<SolanaTerm[]> {
  const shuffled = [...SOLANA_TERMS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function scrambleWord(word: string): string {
  return word
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

export function generateWordSearchGrid(words: string[]): string[][] {
  const size = 10;
  const grid: string[][] = Array(size)
    .fill(null)
    .map(() =>
      Array(size)
        .fill("")
        .map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26)))
    );

  words.forEach((word) => {
    const direction = Math.random() < 0.5 ? "horizontal" : "vertical";
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 100) {
      const row = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * size);

      if (direction === "horizontal" && col + word.length <= size) {
        let canPlace = true;
        for (let i = 0; i < word.length; i++) {
          if (grid[row][col + i] !== "" && grid[row][col + i] !== word[i]) {
            canPlace = false;
            break;
          }
        }
        if (canPlace) {
          for (let i = 0; i < word.length; i++) {
            grid[row][col + i] = word[i].toUpperCase();
          }
          placed = true;
        }
      } else if (direction === "vertical" && row + word.length <= size) {
        let canPlace = true;
        for (let i = 0; i < word.length; i++) {
          if (grid[row + i][col] !== "" && grid[row + i][col] !== word[i]) {
            canPlace = false;
            break;
          }
        }
        if (canPlace) {
          for (let i = 0; i < word.length; i++) {
            grid[row + i][col] = word[i].toUpperCase();
          }
          placed = true;
        }
      }
      attempts++;
    }
  });

  return grid;
}
