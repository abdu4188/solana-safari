export type PuzzleType = "wordsearch" | "anagram" | "quiz";

export interface Puzzle {
  id: string;
  type: PuzzleType;
  difficulty: "easy" | "medium" | "hard";
  title?: string;
  content: string;
  solution: string;
  hints?: string[];
  points: number;
  explanation?: string;
}

export interface WordSearchPuzzle extends Puzzle {
  type: "wordsearch";
  grid: string[][];
  words: string[];
  partialWords?: string[];
}

export interface AnagramPuzzle extends Puzzle {
  type: "anagram";
  scrambledWord: string;
}

export interface QuizPuzzle extends Puzzle {
  type: "quiz";
  options: string[];
}
