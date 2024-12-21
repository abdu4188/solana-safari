"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface QuizQuestion {
  question: string;
  answer: string;
  hint?: string;
}

export function WordQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(
    null
  );
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const generateNewQuestion = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call to generate question
      const response = await fetch("/api/generate-question", {
        method: "POST",
      });
      const data = await response.json();
      setCurrentQuestion(data);
      setUserAnswer("");
      setFeedback("");
    } catch (error) {
      console.error("Failed to generate question:", error);
      setFeedback("Failed to generate question. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const checkAnswer = () => {
    if (!currentQuestion) return;

    const isCorrect =
      userAnswer.toLowerCase().trim() ===
      currentQuestion.answer.toLowerCase().trim();
    setFeedback(isCorrect ? "🎉 Correct!" : "❌ Try again!");
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Word Puzzle Quiz</CardTitle>
        <CardDescription>
          Test your vocabulary with AI-generated word puzzles!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!currentQuestion ? (
          <Button onClick={generateNewQuestion} disabled={isLoading}>
            {isLoading ? "Generating..." : "Generate New Question"}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">{currentQuestion.question}</p>
              {currentQuestion.hint && (
                <p className="text-sm text-muted-foreground mt-2">
                  Hint: {currentQuestion.hint}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Type your answer..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && checkAnswer()}
              />
              <Button onClick={checkAnswer}>Check</Button>
            </div>

            {feedback && (
              <p
                className={`text-center font-medium ${
                  feedback.includes("Correct")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {feedback}
              </p>
            )}

            <Button
              variant="outline"
              onClick={generateNewQuestion}
              disabled={isLoading}
            >
              Next Question
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
