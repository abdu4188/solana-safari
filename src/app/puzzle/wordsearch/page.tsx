"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { createReward } from "@/lib/actions/rewards";
import { useAuth } from "@clerk/nextjs";
import type { WordSearchPuzzle } from "@/lib/types";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Logger from "@/lib/logger";

export default function WordSearchPuzzle() {
  const [selectedCells, setSelectedCells] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [puzzle, setPuzzle] = useState<WordSearchPuzzle | null>(null);
  const { toast } = useToast();
  const { userId } = useAuth();

  useEffect(() => {
    loadNewPuzzle();
  }, []);

  const loadNewPuzzle = async () => {
    setLoading(true);
    try {
      Logger.info("api", "Generating new word search puzzle", {
        type: "wordsearch",
        difficulty: "medium",
        topic: "Solana blockchain",
      });

      const response = await fetch("/api/generate-puzzle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "wordsearch",
          difficulty: "medium",
          topic: "Solana blockchain",
          gameId: 1,
        }),
      });

      if (!response.ok) {
        Logger.error("api", "Failed to fetch puzzle", {
          status: response.status,
          statusText: response.statusText,
        });
        throw new Error("Failed to fetch puzzle");
      }

      const data = await response.json();

      if (data.error) {
        Logger.error("api", "Puzzle generation error", { error: data.error });
        throw new Error(data.error);
      }

      // Start polling for puzzle status
      const puzzleId = data.puzzleId;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds timeout

      while (attempts < maxAttempts) {
        const statusResponse = await fetch(`/api/puzzle-status/${puzzleId}`);
        const statusData = await statusResponse.json();

        if (statusData.status === "completed") {
          console.log("Raw puzzle data:", statusData.puzzle);
          // Extract grid and words from the correct location in the response
          const grid =
            statusData.puzzle.grid || statusData.puzzle.metadata?.grid;
          if (grid) {
            setPuzzleGrid(grid);
            setWords(statusData.puzzle.words || []);
            setSelectedCells([]);
            setFoundWords([]);
          }
          break;
        } else if (statusData.status === "error") {
          throw new Error(statusData.error || "Failed to generate puzzle");
        }

        // Wait 1 second before next attempt
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;
      }

      if (attempts >= maxAttempts) {
        throw new Error("Puzzle generation timed out");
      }
    } catch (error) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = (row: number, col: number) => {
    const cellId = `${row}-${col}`;
    if (selectedCells.includes(cellId)) {
      setSelectedCells(selectedCells.filter((id) => id !== cellId));
    } else {
      setSelectedCells([...selectedCells, cellId]);
    }
  };

  const checkWord = async () => {
    if (!puzzle || !userId) return;

    const selectedWord = selectedCells
      .map((cellId) => {
        const [row, col] = cellId.split("-").map(Number);
        return puzzle.grid[row][col];
      })
      .join("");

    Logger.debug("app", "Checking selected word", {
      selectedWord,
      selectedCells,
    });

    if (
      puzzle.words.includes(selectedWord) &&
      !foundWords.includes(selectedWord)
    ) {
      const newFoundWords = [...foundWords, selectedWord];
      setFoundWords(newFoundWords);

      if (newFoundWords.length === puzzle.words.length) {
        Logger.info("app", "Puzzle completed", {
          foundWords: newFoundWords,
          totalWords: puzzle.words.length,
        });

        // All words found - create reward
        const result = await createReward({
          userId: userId,
          puzzleId: parseInt(puzzle.id),
          tokenType: "points",
          tokenAmount: puzzle.points,
          reason: "Word search puzzle completed",
        });

        if (result.success) {
          // Emit points updated event
          window.dispatchEvent(new Event("points-updated"));

          Logger.info("api", "Reward created for puzzle completion", {
            userId,
            puzzleId: puzzle.id,
            points: puzzle.points,
          });

          toast({
            description: `🎉 Congratulations! You earned ${puzzle.points} points!`,
            className: "bg-green-500 text-white",
          });
        }
      } else {
        Logger.info("app", "Word found", {
          word: selectedWord,
          foundWordsCount: newFoundWords.length,
          totalWords: puzzle.words.length,
        });

        toast({
          description: `✨ Great! You found "${selectedWord}"!`,
          className: "bg-green-500 text-white",
        });
      }
      setSelectedCells([]);
    } else if (puzzle.words.includes(selectedWord)) {
      Logger.debug("app", "Word already found", { selectedWord });
      toast({
        description: "🔍 You've already found this word!",
        className: "bg-yellow-500 text-white",
      });
      setSelectedCells([]);
    } else {
      Logger.debug("app", "Invalid word attempt", { selectedWord });
      toast({
        variant: "destructive",
        description: "❌ That's not one of the words. Try again!",
      });
      setSelectedCells([]);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-spin" style={{ animationDuration: '3s' }}></div>
          <div className="absolute inset-1 bg-white rounded-full"></div>
          <div className="absolute inset-3 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse"></div>
        </div>
        <h2 className="text-xl font-semibold mb-2 animate-pulse">Generating Your Puzzle</h2>
        <p className="text-muted-foreground text-center">
          Our AI is crafting a unique word search experience...
        </p>
      </div>
    );
  }

  if (!puzzle) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p>Error loading puzzle. Please try again.</p>
        <Button onClick={loadNewPuzzle} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  const allWordsFound = puzzle?.words
    ? foundWords.length === puzzle.words.length
    : false;

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-8">
        <Link href="/">
          <Button variant="ghost" size="icon" className="mr-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="text-center flex-1">
          <h1 className="text-3xl font-bold mb-2">Solana Word Search</h1>
          <p className="text-muted-foreground mb-4">
            Find these Solana and Web3 terms hidden in the grid
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Card className="p-4">
            <div className="grid grid-cols-10 gap-1">
              {puzzle.grid.map((row, rowIndex) =>
                row.map((letter, colIndex) => (
                  <Button
                    key={`${rowIndex}-${colIndex}`}
                    variant={
                      selectedCells.includes(`${rowIndex}-${colIndex}`)
                        ? "secondary"
                        : "outline"
                    }
                    className="w-8 h-8 sm:w-10 sm:h-10 p-0 font-bold text-sm sm:text-base"
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                  >
                    {letter}
                  </Button>
                ))
              )}
            </div>
          </Card>
          <div className="mt-4 space-y-2">
            <Button
              className="w-full"
              onClick={checkWord}
              disabled={selectedCells.length === 0}
            >
              Check Word
            </Button>
            {allWordsFound && (
              <Button
                className="w-full"
                onClick={() => {
                  setFoundWords([]);
                  setSelectedCells([]);
                  loadNewPuzzle();
                }}
              >
                Play Again
              </Button>
            )}
          </div>
        </div>

        <div>
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">Words to Find</h2>
            <div className="space-y-2">
              {puzzle.words.map((word, index) => {
                // Show partial words for longer or more complex terms
                const shouldShowPartial = word.length > 6;
                const partialWord = shouldShowPartial
                  ? word
                      .split("")
                      .map((char, i) => {
                        // Show first letter, last letter, and some middle letters
                        if (
                          i === 0 ||
                          i === word.length - 1 ||
                          Math.random() < 0.3
                        ) {
                          return char;
                        }
                        return "_";
                      })
                      .join("")
                  : word.replace(/[A-Z]/g, "_");

                return (
                  <div
                    key={word}
                    className={`p-2 rounded ${
                      foundWords.includes(word)
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <div className="flex flex-col space-y-1">
                      {foundWords.includes(word) ? (
                        <span className="font-semibold">{word}</span>
                      ) : (
                        <>
                          <span className="font-mono">
                            {puzzle.partialWords?.[index] || partialWord}
                          </span>
                          <span className="text-sm text-gray-600">
                            {puzzle.hints?.[index] || "Find this word!"}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
