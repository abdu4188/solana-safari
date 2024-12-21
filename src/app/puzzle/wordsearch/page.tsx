"use client";

import { useState } from "react";
import { wordSearchPuzzle } from "@/lib/dummy-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function WordSearchPuzzle() {
  const [selectedCells, setSelectedCells] = useState<string[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    const cellId = `${rowIndex}-${colIndex}`;
    setSelectedCells((prev) =>
      prev.includes(cellId)
        ? prev.filter((id) => id !== cellId)
        : [...prev, cellId]
    );
  };

  const checkWord = () => {
    const selectedWord = selectedCells
      .map((cellId) => {
        const [row, col] = cellId.split("-").map(Number);
        return wordSearchPuzzle.grid[row][col];
      })
      .join("");

    if (
      wordSearchPuzzle.words.includes(selectedWord) &&
      !foundWords.includes(selectedWord)
    ) {
      setFoundWords((prev) => [...prev, selectedWord]);
      setSelectedCells([]);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Word Search Puzzle</h1>
        <p className="text-muted-foreground mb-4">
          {wordSearchPuzzle.question}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Card className="p-4">
            <div className="grid grid-cols-10 gap-1">
              {wordSearchPuzzle.grid.map((row, rowIndex) =>
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
          <Button
            className="mt-4 w-full"
            onClick={checkWord}
            disabled={selectedCells.length === 0}
          >
            Check Word
          </Button>
        </div>

        <div>
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">Words to Find</h2>
            <div className="space-y-2">
              {wordSearchPuzzle.words.map((word) => (
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

          {wordSearchPuzzle.hints && (
            <Card className="p-4 mt-4">
              <h2 className="text-xl font-semibold mb-4">Hints</h2>
              <ul className="list-disc list-inside space-y-2">
                {wordSearchPuzzle.hints.map((hint, index) => (
                  <li key={index} className="text-muted-foreground">
                    {hint}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
