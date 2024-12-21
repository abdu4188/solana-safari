"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getRandomWord, scrambleWord, SolanaTerm } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export default function AnagramPuzzle() {
  const [answer, setAnswer] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [puzzle, setPuzzle] = useState<{
    term: SolanaTerm;
    scrambledWord: string;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadNewWord();
  }, []);

  const loadNewWord = async () => {
    setLoading(true);
    setShowHint(false);
    try {
      const term = await getRandomWord();
      setPuzzle({
        term,
        scrambledWord: scrambleWord(term.term),
      });
    } catch (error) {
      console.error("Failed to load word:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load a new word. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkAnswer = () => {
    if (answer.toUpperCase() === puzzle?.term.term) {
      setIsCorrect(true);
      toast({
        description: "🎉 Correct! You know your Solana concepts!",
        className: "bg-green-500 text-white",
      });
      // Show the explanation
      toast({
        title: "Learn More",
        description: puzzle.term.description,
        className: "bg-blue-500 text-white mt-2",
      });
    } else {
      toast({
        variant: "destructive",
        description: "❌ That's not the correct word. Try again!",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p>Loading puzzle...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Solana Anagram Challenge</h1>
          <p className="text-muted-foreground mb-4">
            Unscramble the letters to find the Solana-related word
          </p>
        </div>

        <Card className="p-6 mb-6">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-mono tracking-wider mb-4">
              {puzzle?.scrambledWord}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Category: {puzzle?.term.category}
                </span>
                <span className="text-sm text-muted-foreground">
                  Difficulty: {puzzle?.term.difficulty}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowHint(!showHint)}
                className="text-sm"
              >
                {showHint ? "Hide Hint" : "Show Hint"}
              </Button>
              {showHint && puzzle && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {puzzle.term.hint}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Enter your answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="text-center text-lg"
              disabled={isCorrect}
              onKeyDown={(e) => {
                if (e.key === "Enter" && answer && !isCorrect) {
                  checkAnswer();
                }
              }}
            />
            <Button
              className="w-full"
              onClick={checkAnswer}
              disabled={!answer || isCorrect}
            >
              Check Answer
            </Button>
            {isCorrect && (
              <Button
                className="w-full"
                onClick={() => {
                  setAnswer("");
                  setIsCorrect(false);
                  loadNewWord();
                }}
              >
                Try Another Word
              </Button>
            )}
          </div>
        </Card>
      </div>
      <Toaster />
    </div>
  );
}
