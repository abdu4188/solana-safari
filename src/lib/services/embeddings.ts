import { openai } from "./openai-client";
import { kv } from "@vercel/kv";

interface Term {
  term: string;
  embedding: number[];
}

export interface EmbeddingSearchResult {
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

export async function searchSimilarContent(
  embedding: number[],
  limit = 3
): Promise<EmbeddingSearchResult[]> {
  try {
    const results = (await kv.zrange(
      `embeddings:${embedding.join(",")}`,
      0,
      limit - 1,
      {
        withScores: true,
      }
    )) as [string, number][];

    return results.map(([content, score]) => ({
      content,
      metadata: {},
      similarity: score,
    }));
  } catch (error) {
    console.error("Error searching similar content:", error);
    return [];
  }
}

export async function getRandomWords(count: number): Promise<Term[]> {
  // For now, return a simple list of Solana-related terms
  const terms = [
    "PHANTOM",
    "SERUM",
    "RAYDIUM",
    "METAPLEX",
    "SEALEVEL",
    "GULFSTREAM",
    "VALIDATOR",
    "STAKING",
    "PROGRAM",
    "ACCOUNT",
  ];

  const selectedTerms = terms
    .sort(() => Math.random() - 0.5)
    .slice(0, count)
    .map((term) => ({ term, embedding: [] }));

  return selectedTerms;
}

export async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });

  return response.data[0].embedding;
}
