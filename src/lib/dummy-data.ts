import { WordSearchPuzzle, AnagramPuzzle, QuizPuzzle } from "./types";

export const wordSearchPuzzle: WordSearchPuzzle = {
  id: "1",
  type: "wordsearch",
  difficulty: "medium",
  question: "Find these crypto-related words",
  answer: "All words found",
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
  question: "Unscramble this cryptocurrency",
  answer: "ETHEREUM",
  scrambledWord: "MURETHE",
  points: 50,
  hints: ["Smart contract platform", "Second largest by market cap"],
};

export const quizPuzzle: QuizPuzzle = {
  id: "3",
  type: "quiz",
  difficulty: "hard",
  question: "Who created Bitcoin?",
  answer: "Satoshi Nakamoto",
  options: [
    "Satoshi Nakamoto",
    "Vitalik Buterin",
    "Charlie Lee",
    "Craig Wright",
  ],
  points: 75,
  hints: ["Anonymous creator", "Published the whitepaper in 2008"],
};
