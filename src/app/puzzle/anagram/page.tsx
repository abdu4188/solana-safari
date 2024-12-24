"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { createReward } from "@/lib/actions/rewards";
import { useAuth } from "@clerk/nextjs";
import type { AnagramPuzzle } from "@/lib/types";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AnagramPuzzle() {
  const [answer, setAnswer] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [puzzle, setPuzzle] = useState<AnagramPuzzle | null>(null);
  const { toast } = useToast();
  const { userId } = useAuth();

  const loadNewPuzzle = useCallback(async () => {
    setLoading(true);
    setShowHint(false);
    try {
      const response = await fetch("/api/generate-puzzle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "anagram",
          difficulty: "medium",
          topic: "Solana blockchain",
          gameId: 1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch puzzle");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // If we got a complete puzzle immediately (from cache), use it
      if (data.puzzle && data.puzzle.content && data.puzzle.solution) {
        setPuzzle(data.puzzle);
        setAnswer("");
        setIsCorrect(false);
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
            setPuzzle(statusData.puzzle);
            setAnswer("");
            setIsCorrect(false);
            return;
          } else if (statusData.status === "error") {
            lastError = statusData.error;
            throw new Error(statusData.error || "Failed to generate puzzle");
          }

          // Exponential backoff with max of 3 seconds
          backoffMs = Math.min(backoffMs * 1.5, 3000);
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
          attempts++;
        } catch (pollError) {
          console.error("Polling error:", pollError);
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
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to load puzzle",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadNewPuzzle();
  }, [loadNewPuzzle]);

  const checkAnswer = async () => {
    if (!puzzle || !userId || !answer) return;

    if (answer.toUpperCase() === puzzle.solution.toUpperCase()) {
      setIsCorrect(true);

      // Create reward
      const result = await createReward({
        userId: userId,
        puzzleId: parseInt(puzzle.id),
        tokenType: "points",
        tokenAmount: puzzle.points,
        reason: "Anagram puzzle completed",
      });

      if (result.success) {
        // Emit points updated event
        window.dispatchEvent(new Event("points-updated"));

        toast({
          description: `🎉 Correct! You earned ${puzzle.points} points!`,
          className: "bg-green-500 text-white",
        });
      } else {
        toast({
          description: "🎉 Correct! Well done!",
          className: "bg-green-500 text-white",
        });
      }

      // Show the explanation if available
      if (puzzle.explanation) {
        toast({
          title: "Learn More",
          description: puzzle.explanation,
          className: "bg-blue-500 text-white mt-2",
        });
      }
    } else {
      toast({
        variant: "destructive",
        description: "❌ That's not the correct word. Try again!",
      });
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

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" className="mr-4">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold mb-2">
              {puzzle.title || "Solana Anagram Challenge"}
            </h1>
            <p className="text-muted-foreground mb-4">
              Unscramble the letters to find the Solana-related word
            </p>
          </div>
        </div>

        <Card className="p-6 mb-6">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-mono tracking-wider mb-4">
              {puzzle.content}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Difficulty: {puzzle.difficulty}
                </span>
                <span className="text-sm font-semibold">
                  {puzzle.points} points
                </span>
              </div>
              {puzzle.hints && puzzle.hints.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowHint(!showHint)}
                    className="text-sm"
                  >
                    {showHint ? "Hide Hint" : "Show Hint"}
                  </Button>
                  {showHint && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <ul className="list-disc list-inside space-y-2">
                        {puzzle.hints.map((hint, index) => (
                          <li
                            key={index}
                            className="text-sm text-muted-foreground"
                          >
                            {hint}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
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
                  loadNewPuzzle();
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
