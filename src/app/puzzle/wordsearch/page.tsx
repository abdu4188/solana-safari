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
  const [puzzleGrid, setPuzzleGrid] = useState<string[][]>([]);
  const [words, setWords] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
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

      // If we got a complete puzzle immediately (from cache), use it
      if (data.puzzle && data.puzzle.grid && data.puzzle.words) {
        Logger.info("api", "Using cached puzzle");
        setPuzzleGrid(data.puzzle.grid);
        setWords(data.puzzle.words);
        setSelectedCells([]);
        setFoundWords([]);
        return;
      }

      // Otherwise, start polling with exponential backoff
      const puzzleId = data.puzzle.id;
      let attempts = 0;
      const maxAttempts = 60; // 60 seconds total timeout
      let lastError = null;
      let backoffMs = 500; // Start with 500ms delay

      while (attempts < maxAttempts) {
        try {
          const statusResponse = await fetch(`/api/puzzle-status/${puzzleId}`);
          const statusData = await statusResponse.json();

          if (statusData.status === "completed") {
            Logger.info("api", "Puzzle generation completed");
            const grid =
              statusData.puzzle.grid || statusData.puzzle.metadata?.grid;
            const words =
              statusData.puzzle.words || statusData.puzzle.metadata?.words;

            if (grid && words) {
              setPuzzleGrid(grid);
              setWords(words);
              setSelectedCells([]);
              setFoundWords([]);
              return;
            } else {
              throw new Error("Invalid puzzle data: missing grid or words");
            }
          } else if (statusData.status === "error") {
            lastError = statusData.error;
            throw new Error(statusData.error || "Failed to generate puzzle");
          }

          // Exponential backoff with max of 3 seconds
          backoffMs = Math.min(backoffMs * 1.5, 3000);
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          attempts++;
        } catch (pollError) {
          Logger.error("api", "Polling error", { error: pollError });
          lastError = pollError;
          backoffMs = Math.min(backoffMs * 1.5, 3000);
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          attempts++;
        }
      }

      throw new Error(
        `Puzzle generation timed out after ${maxAttempts} seconds. ${
          lastError ? `Last error: ${lastError}` : ""
        }`
      );
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
    if (!puzzleGrid || !userId) return;

    const selectedWord = selectedCells
      .map((cellId) => {
        const [row, col] = cellId.split("-").map(Number);
        return puzzleGrid[row][col];
      })
      .join("");

    Logger.debug("app", "Checking selected word", {
      selectedWord,
      selectedCells,
    });

    if (words.includes(selectedWord) && !foundWords.includes(selectedWord)) {
      const newFoundWords = [...foundWords, selectedWord];
      setFoundWords(newFoundWords);

      if (newFoundWords.length === words.length) {
        Logger.info("app", "Puzzle completed", {
          foundWords: newFoundWords,
          totalWords: words.length,
        });

        // All words found - create reward
        const result = await createReward({
          userId: userId,
          puzzleId: 1, // TODO: Get actual puzzle ID
          tokenType: "points",
          tokenAmount: 100, // TODO: Get actual points
          reason: "Word search puzzle completed",
        });

        if (result.success) {
          // Emit points updated event
          window.dispatchEvent(new Event("points-updated"));

          Logger.info("api", "Reward created for puzzle completion", {
            userId,
            puzzleId: 1,
            points: 100,
          });

          toast({
            description: `🎉 Congratulations! You earned 100 points!`,
            className: "bg-green-500 text-white",
          });
        }
      } else {
        Logger.info("app", "Word found", {
          word: selectedWord,
          foundWordsCount: newFoundWords.length,
          totalWords: words.length,
        });

        toast({
          description: `✨ Great! You found "${selectedWord}"!`,
          className: "bg-green-500 text-white",
        });
      }
      setSelectedCells([]);
    } else if (words.includes(selectedWord)) {
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
          <div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-spin"
            style={{ animationDuration: "3s" }}
          ></div>
          <div className="absolute inset-1 bg-white rounded-full"></div>
          <div className="absolute inset-3 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse"></div>
        </div>
        <h2 className="text-xl font-semibold mb-2 animate-pulse">
          Generating Your Puzzle
        </h2>
        <p className="text-muted-foreground text-center">
          Our AI is crafting a unique word search experience...
        </p>
      </div>
    );
  }

  if (!puzzleGrid || !words) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-red-500 mb-4">
          {error || "Error loading puzzle. Please try again."}
        </p>
        <Button onClick={loadNewPuzzle} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  const allWordsFound = words ? foundWords.length === words.length : false;

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
        <Card className="p-4">
          <div className="grid grid-cols-10 gap-1">
            {puzzleGrid.map((row: string[], rowIndex: number) =>
              row.map((letter: string, colIndex: number) => {
                const cellId = `${rowIndex}-${colIndex}`;
                const isSelected = selectedCells.includes(cellId);
                return (
                  <button
                    key={cellId}
                    onClick={() => handleCellClick(rowIndex, colIndex)}
                    className={`w-8 h-8 flex items-center justify-center font-bold rounded ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary hover:bg-secondary/80"
                    }`}
                  >
                    {letter}
                  </button>
                );
              })
            )}
          </div>
          <div className="mt-4 flex justify-between">
            <Button onClick={() => setSelectedCells([])}>
              Clear Selection
            </Button>
            <Button onClick={checkWord}>Check Word</Button>
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-4">Words to Find</h2>
          <div className="grid grid-cols-2 gap-2">
            {words.map((word: string, index: number) => (
              <div
                key={index}
                className={`p-2 rounded ${
                  foundWords.includes(word)
                    ? "bg-green-500/20 line-through"
                    : "bg-secondary"
                }`}
              >
                {word.split("").map((char: string, i: number) => (
                  <span
                    key={i}
                    className={
                      foundWords.includes(word) ? "text-green-700" : ""
                    }
                  >
                    {char}
                  </span>
                ))}
              </div>
            ))}
          </div>
          {allWordsFound && (
            <div className="mt-4 text-center">
              <p className="text-green-600 font-semibold mb-2">
                🎉 Congratulations! You found all the words!
              </p>
              <Button onClick={loadNewPuzzle}>Play Again</Button>
            </div>
          )}
        </Card>
      </div>
      <Toaster />
    </div>
  );
}
