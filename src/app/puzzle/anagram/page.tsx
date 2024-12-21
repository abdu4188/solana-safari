"use client";

import { useState } from "react";
import { anagramPuzzle } from "@/lib/dummy-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AnagramPuzzle() {
  const [answer, setAnswer] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const checkAnswer = () => {
    if (answer.toUpperCase() === anagramPuzzle.answer) {
      setIsCorrect(true);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Crypto Anagram</h1>
          <p className="text-muted-foreground mb-4">{anagramPuzzle.question}</p>
        </div>

        <Card className="p-6 mb-6">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-mono tracking-wider mb-4">
              {anagramPuzzle.scrambledWord}
            </h2>
            <p className="text-sm text-muted-foreground">
              Unscramble the letters to find the cryptocurrency
            </p>
          </div>

          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Enter your answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="text-center text-lg"
              disabled={isCorrect}
            />
            <Button
              className="w-full"
              onClick={checkAnswer}
              disabled={!answer || isCorrect}
            >
              Check Answer
            </Button>
          </div>

          {isCorrect && (
            <div className="mt-4 p-4 bg-green-500/10 text-green-500 rounded-md text-center">
              🎉 Correct! You solved the anagram!
            </div>
          )}
        </Card>

        {anagramPuzzle.hints && (
          <Card className="p-6">
            <div className="text-center mb-4">
              <Button
                variant="outline"
                onClick={() => setShowHint(!showHint)}
                className="mb-4"
              >
                {showHint ? "Hide Hint" : "Show Hint"}
              </Button>
            </div>
            {showHint && (
              <ul className="list-disc list-inside space-y-2">
                {anagramPuzzle.hints.map((hint, index) => (
                  <li key={index} className="text-muted-foreground">
                    {hint}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
