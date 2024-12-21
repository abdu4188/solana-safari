import OpenAI from "openai";
import { searchSimilarContent } from "./embeddings";
import { getEmbedding } from "./openai";
import { QuizPuzzle } from "../types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateSolanaQuiz(topic: string): Promise<QuizPuzzle> {
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
  "question": "The question text",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "answer": "The correct option exactly as written in options",
  "explanation": "Brief explanation of why this is correct",
  "difficulty": "easy|medium|hard",
  "hints": ["Hint 1", "Hint 2"]
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
    return {
      id: Math.random().toString(36).substring(7), // temporary ID
      type: "quiz",
      difficulty: quiz.difficulty,
      question: quiz.question,
      answer: quiz.answer,
      options: quiz.options,
      points:
        quiz.difficulty === "hard"
          ? 100
          : quiz.difficulty === "medium"
          ? 75
          : 50,
      hints: quiz.hints,
      explanation: quiz.explanation,
    };
  } catch (error) {
    console.error("Failed to parse quiz response:", error);
    throw new Error("Failed to generate valid quiz");
  }
}
