"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { QuizPuzzle } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { SOLANA_TOPICS } from "@/lib/constants";
import { createReward } from "@/lib/actions/rewards";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function QuizPuzzle() {
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<QuizPuzzle | null>(null);
  const { toast } = useToast();
  const { userId } = useAuth();

  const loadNewQuiz = async () => {
    setLoading(true);
    setShowHint(false);
    setIsCorrect(null);
    setSelectedAnswer("");
    try {
      // Randomly select a Solana topic
      const topic =
        SOLANA_TOPICS[Math.floor(Math.random() * SOLANA_TOPICS.length)];

      // Call the API route
      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch quiz");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setQuiz(data.quiz);
    } catch (error) {
      console.error("Failed to load quiz:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load a new quiz. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNewQuiz();
  }, []);

  const checkAnswer = async () => {
    if (!quiz || !userId) return;

    const correct = selectedAnswer === quiz.solution;
    setIsCorrect(correct);

    if (correct) {
      toast({
        description: "🎉 Correct! Well done!",
        className: "bg-green-500 text-white",
      });

      // Create reward
      const result = await createReward({
        userId: userId,
        puzzleId: parseInt(quiz.id),
        tokenType: "points",
        tokenAmount: quiz.points,
        reason: "Quiz completed successfully",
      });

      if (result.success) {
        // Emit points updated event
        window.dispatchEvent(new Event("points-updated"));

        toast({
          description: `🎁 You earned ${quiz.points} points!`,
          className: "bg-blue-500 text-white",
        });
      }

      // Show the explanation
      if (quiz.explanation) {
        toast({
          title: "Learn More",
          description: quiz.explanation,
          className: "bg-blue-500 text-white mt-2",
        });
      }
    } else {
      toast({
        variant: "destructive",
        description: "❌ That's not correct. Try again!",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent rounded-full animate-spin" />
          <p className="text-lg font-medium text-muted-foreground animate-pulse">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="container mx-auto p-4 text-center">
        <p>Error loading quiz. Please try again.</p>
        <Button onClick={loadNewQuiz} className="mt-4">
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
            <h1 className="text-3xl font-bold mb-2">Solana Quiz Challenge</h1>
            <p className="text-muted-foreground mb-4">
              Test your Solana knowledge!
            </p>
          </div>
        </div>

        <Card className="p-6 mb-6">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-muted-foreground">
                Difficulty: {quiz.difficulty}
              </span>
              <span className="text-sm font-semibold">
                {quiz.points} points
              </span>
            </div>
            <h2 className="text-xl font-semibold mb-4">{quiz.content}</h2>
          </div>

          <RadioGroup
            value={selectedAnswer}
            onValueChange={setSelectedAnswer}
            className="space-y-4"
          >
            {quiz.options.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={option}
                  id={option}
                  disabled={isCorrect !== null}
                />
                <Label
                  htmlFor={option}
                  className={`cursor-pointer ${
                    isCorrect !== null &&
                    option === quiz.solution &&
                    "text-green-500 font-semibold"
                  }`}
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <div className="mt-6 space-y-4">
            <Button
              className="w-full"
              onClick={checkAnswer}
              disabled={!selectedAnswer || isCorrect !== null}
            >
              Check Answer
            </Button>

            {quiz.hints && quiz.hints.length > 0 && (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => setShowHint(!showHint)}
                  className="mb-4"
                >
                  {showHint ? "Hide Hint" : "Show Hint"}
                </Button>
                {showHint && (
                  <ul className="list-disc list-inside space-y-2">
                    {quiz.hints.map((hint, index) => (
                      <li key={index} className="text-muted-foreground">
                        {hint}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {isCorrect !== null && (
              <Button className="w-full" onClick={loadNewQuiz}>
                Try Another Question
              </Button>
            )}
          </div>
        </Card>
      </div>
      <Toaster />
    </div>
  );
}
