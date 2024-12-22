import { WordSearchPuzzle, AnagramPuzzle, QuizPuzzle } from "./types";

export const wordSearchPuzzle: WordSearchPuzzle = {
  id: "1",
  type: "wordsearch",
  difficulty: "medium",
  content: "Find these crypto-related words",
  solution: "All words found",
  points: 100,
  grid: [
    ["B", "I", "T", "C", "O", "I", "N", "X", "Y", "Z"],
    ["L", "M", "N", "O", "P", "Q", "R", "S", "T", "U"],
    ["O", "P", "Q", "R", "S", "T", "U", "V", "W", "X"],
    ["C", "R", "Y", "P", "T", "O", "Z", "A", "B", "C"],
    ["K", "L", "M", "N", "O", "P", "Q", "R", "S", "T"],
    ["C", "H", "A", "I", "N", "U", "V", "W", "X", "Y"],
    ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"],
    ["N", "F", "T", "U", "V", "W", "X", "Y", "Z", "A"],
    ["B", "C", "D", "E", "F", "G", "H", "I", "J", "K"],
    ["L", "M", "N", "O", "P", "Q", "R", "S", "T", "U"],
  ],
  words: ["BITCOIN", "CRYPTO", "CHAIN", "NFT"],
  hints: [
    "Digital gold",
    "General term for the industry",
    "Blocks linked together",
    "Digital collectible",
  ],
};

export const anagramPuzzle: AnagramPuzzle = {
  id: "2",
  type: "anagram",
  difficulty: "easy",
  content: "Unscramble this cryptocurrency",
  solution: "ETHEREUM",
  scrambledWord: "MURETHE",
  points: 100,
  hints: ["Smart contract platform", "Second largest by market cap"],
};

export const quizPuzzle: QuizPuzzle = {
  id: "3",
  type: "quiz",
  difficulty: "hard",
  content: "Who created Bitcoin?",
  solution: "Satoshi Nakamoto",
  options: [
    "Satoshi Nakamoto",
    "Vitalik Buterin",
    "Charlie Lee",
    "Craig Wright",
  ],
  points: 100,
  hints: ["Anonymous creator", "Published the whitepaper in 2008"],
};
