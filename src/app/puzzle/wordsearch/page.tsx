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
      console.log("API Response:", data);

      if (data.error) {
        Logger.error("api", "Puzzle generation error", { error: data.error });
        throw new Error(data.error);
      }

      if (!data.success || !data.puzzle) {
        throw new Error("Invalid puzzle data received");
      }

      console.log("Raw puzzle data:", data.puzzle);

      // Extract grid and words from the correct location in the response
      const grid = data.puzzle.grid || data.puzzle.metadata?.grid;
      const words = data.puzzle.words || data.puzzle.metadata?.words;

      if (!grid || !Array.isArray(grid) || grid.length === 0) {
        Logger.error("api", "Invalid grid data", { grid });
        throw new Error("Invalid grid data received");
      }

      if (!words || !Array.isArray(words) || words.length === 0) {
        Logger.error("api", "Invalid words data", { words });
        throw new Error("Invalid words data received");
      }

      // Convert the API response to the expected WordSearchPuzzle format
      const puzzleData: WordSearchPuzzle = {
        id: data.puzzle.id.toString(),
        type: "wordsearch",
        difficulty: data.puzzle.difficulty || "medium",
        content:
          data.puzzle.content ||
          "Find these Solana and Web3 terms hidden in the grid",
        solution: data.puzzle.solution || "",
        points: data.puzzle.points || 100,
        hints: data.puzzle.hints || [],
        grid: grid,
        words: words,
      };

      console.log("Converted puzzle data:", puzzleData);

      Logger.info("ai", "Successfully generated puzzle", {
        wordCount: puzzleData.words.length,
        gridSize: puzzleData.grid.length,
      });

      setPuzzle(puzzleData);
    } catch (error) {
      console.error("Failed to load puzzle:", error);
      Logger.error("api", "Failed to load puzzle", { error });
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load a new puzzle. Please try again.",
      });
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
      <div className="container mx-auto p-4 text-center">
        <p>Loading puzzle...</p>
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
                    className="w-10 h-10 p-0 font-bold"
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
              {puzzle.words.map((word) => (
                <div
                  key={word}
                  className={`p-2 rounded ${
                    foundWords.includes(word)
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {word}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
