import { WordQuiz } from "@/components/quiz/word-quiz";

export default function QuizPage() {
  return (
    <main className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Word Puzzle Quiz</h1>
      <WordQuiz />
    </main>
  );
}
