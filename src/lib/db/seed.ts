import { db } from "./index";
import { games } from "./schema/resources";

async function seed() {
  try {
    // Create the word puzzle game
    const [wordPuzzleGame] = await db
      .insert(games)
      .values({
        name: "Word Puzzle",
        description:
          "A collection of word-based puzzles about blockchain and cryptocurrency",
        rules: {
          maxAttempts: 3,
          timeLimit: 300,
          pointsPerSolve: 100,
        },
        config: {
          types: ["word-puzzle", "anagram", "quiz"],
          difficulties: ["easy", "medium", "hard"],
        },
      })
      .returning();

    console.log("Created game:", wordPuzzleGame);
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
