"use client";

import { useState } from "react";
import { quizPuzzle } from "@/lib/dummy-data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function QuizPuzzle() {
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);

  const checkAnswer = () => {
    setIsCorrect(selectedAnswer === quizPuzzle.answer);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Crypto Quiz</h1>
          <p className="text-muted-foreground mb-4">{quizPuzzle.question}</p>
        </div>

        <Card className="p-6 mb-6">
          <RadioGroup
            value={selectedAnswer}
            onValueChange={setSelectedAnswer}
            className="space-y-4"
          >
            {quizPuzzle.options.map((option) => (
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
                    option === quizPuzzle.answer &&
                    "text-green-500 font-semibold"
                  }`}
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <Button
            className="w-full mt-6"
            onClick={checkAnswer}
            disabled={!selectedAnswer || isCorrect !== null}
          >
            Check Answer
          </Button>

          {isCorrect !== null && (
            <div
              className={`mt-4 p-4 rounded-md text-center ${
                isCorrect
                  ? "bg-green-500/10 text-green-500"
                  : "bg-red-500/10 text-red-500"
              }`}
            >
              {isCorrect ? (
                <span>🎉 Correct! Well done!</span>
              ) : (
                <span>❌ Incorrect. Try again!</span>
              )}
            </div>
          )}
        </Card>

        {quizPuzzle.hints && (
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
                {quizPuzzle.hints.map((hint, index) => (
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
