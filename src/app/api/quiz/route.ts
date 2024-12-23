import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { getEmbedding } from "@/lib/services/openai";
import { searchSimilarContent } from "@/lib/services/embeddings";
import { savePuzzle } from "@/lib/services/puzzle";
import type { QuizPuzzle } from "@/lib/types";

async function generateSolanaQuiz(
  topic: string,
  gameId: number
): Promise<QuizPuzzle> {
  // Get embedding for the topic
  const topicEmbedding = await getEmbedding(topic);

  // Search for relevant content in the knowledge base
  const relevantContent = await searchSimilarContent(topicEmbedding);

  // Create context from relevant content
  const context = relevantContent.map((item) => item.content).join("\n\n");

  // Generate quiz using GPT-4
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are a Solana blockchain expert creating educational quiz questions.
Generate challenging but fair multiple-choice questions based on the provided context.
Focus on testing understanding rather than memorization.
Make sure all options are plausible but only one is correct.
Include a brief explanation for why the answer is correct.`,
      },
      {
        role: "user",
        content: `Create a quiz question about ${topic} using this context:

${context}

Format your response as JSON with this structure:
{
  "title": "A catchy title for the quiz",
  "content": "The question text",
  "solution": "The correct option exactly as written in options",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "explanation": "Brief explanation of why this is correct",
  "difficulty": "easy|medium|hard",
  "hints": ["Hint 1", "Hint 2"],
  "points": 100,
  "timeLimit": 60,
  "metadata": {
    "category": "quiz",
    "topic": "${topic}"
  }
}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 500,
  });

  const quizContent = response.choices[0]?.message?.content;
  if (!quizContent) {
    throw new Error("Failed to generate quiz content");
  }

  try {
    const quiz = JSON.parse(quizContent);

    // Save the quiz to the database
    const savedPuzzle = await savePuzzle(
      gameId,
      quiz,
      "quiz",
      quiz.difficulty,
      relevantContent
    );

    // Convert the database puzzle to a QuizPuzzle type
    return {
      id: savedPuzzle.id.toString(),
      type: "quiz",
      difficulty: quiz.difficulty,
      content: quiz.content,
      solution: quiz.solution,
      options: quiz.options,
      points: quiz.points,
      hints: quiz.hints,
      explanation: quiz.explanation,
    };
  } catch (error) {
    console.error("Failed to parse quiz response:", error);
    throw new Error("Failed to generate valid quiz");
  }
}

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();
    const gameId = 1; // You might want to make this dynamic
    const quiz = await generateSolanaQuiz(topic, gameId);
    return NextResponse.json({ quiz });
  } catch (error) {
    console.error("Error generating quiz:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate quiz",
      },
      { status: 500 }
    );
  }
}
