"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getRandomWords, generateWordSearchGrid } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export default function WordSearchPuzzle() {
  const [selectedCells, setSelectedCells] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [puzzle, setPuzzle] = useState<{
    grid: string[][];
    words: string[];
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadNewPuzzle();
  }, []);

  const loadNewPuzzle = async () => {
    setLoading(true);
    try {
      const words = await getRandomWords(4);
      const upperWords = words.map((w) => w.term.toUpperCase());
      const grid = generateWordSearchGrid(upperWords);
      setPuzzle({
        grid,
        words: upperWords,
      });
    } catch (error) {
      console.error("Failed to load puzzle:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load new puzzle. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    const cellId = `${rowIndex}-${colIndex}`;
    setSelectedCells((prev) =>
      prev.includes(cellId)
        ? prev.filter((id) => id !== cellId)
        : [...prev, cellId]
    );
  };

  const checkWord = () => {
    if (!puzzle) return;

    const selectedWord = selectedCells
      .map((cellId) => {
        const [row, col] = cellId.split("-").map(Number);
        return puzzle.grid[row][col];
      })
      .join("");

    if (
      puzzle.words.includes(selectedWord) &&
      !foundWords.includes(selectedWord)
    ) {
      setFoundWords((prev) => {
        const newFoundWords = [...prev, selectedWord];
        if (newFoundWords.length === puzzle.words.length) {
          toast({
            description:
              "🎉 Congratulations! You&apos;re a true Solana expert!",
            className: "bg-green-500 text-white",
          });
        } else {
          toast({
            description: `✨ Great! You found "${selectedWord}"!`,
            className: "bg-green-500 text-white",
          });
        }
        return newFoundWords;
      });
      setSelectedCells([]);
    } else if (puzzle.words.includes(selectedWord)) {
      toast({
        description: "🔍 You&apos;ve already found this word!",
        className: "bg-yellow-500 text-white",
      });
      setSelectedCells([]);
    } else {
      toast({
        variant: "destructive",
        description: "❌ That&apos;s not one of the words. Try again!",
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
      </div>
    );
  }

  const allWordsFound = foundWords.length === puzzle.words.length;

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Solana Word Search</h1>
        <p className="text-muted-foreground mb-4">
          Find these Solana and Web3 terms hidden in the grid
        </p>
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
            <h2 className="text-xl font-semibold mb-4">Solana Terms to Find</h2>
            <div className="space-y-2">
              {puzzle.words.map((word) => (
                <div
                  key={word}
                  className={`p-2 rounded-md ${
                    foundWords.includes(word)
                      ? "bg-green-500/10 text-green-500"
                      : "bg-secondary"
                  }`}
                >
                  {word}
                  {foundWords.includes(word) && <span className="ml-2">✓</span>}
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
