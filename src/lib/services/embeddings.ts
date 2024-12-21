import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

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
    const results = await db.execute(sql`
      SELECT content::text, metadata::jsonb,
             (1 - (embedding <=> ${JSON.stringify(
               embedding
             )}::vector))::float as similarity
      FROM embeddings
      WHERE 1 - (embedding <=> ${JSON.stringify(embedding)}::vector) > 0.7
      ORDER BY similarity DESC
      LIMIT ${limit};
    `);

    return (results as Array<Record<string, unknown>>)
      .filter((row) => {
        return (
          typeof row.content === "string" &&
          typeof row.similarity === "number" &&
          row.metadata !== null &&
          typeof row.metadata === "object"
        );
      })
      .map((row) => ({
        content: row.content as string,
        metadata: row.metadata as Record<string, unknown>,
        similarity: row.similarity as number,
      }));
  } catch (error) {
    console.error("Error searching similar content:", error);
    return [];
  }
}
