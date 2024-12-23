import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { wordSearchPuzzle, anagramPuzzle, quizPuzzle } from "@/lib/dummy-data";
import Link from "next/link";

export default function Home() {
  const puzzles = [
    {
      title: "Word Search",
      description: "Find crypto-related words in the grid",
      href: "/puzzle/wordsearch",
      difficulty: wordSearchPuzzle.difficulty,
      points: wordSearchPuzzle.points,
      icon: "🔍",
    },
    {
      title: "Anagram",
      description: "Unscramble crypto terms",
      href: "/puzzle/anagram",
      difficulty: anagramPuzzle.difficulty,
      points: anagramPuzzle.points,
      icon: "🔄",
    },
    {
      title: "Quiz",
      description: "Test your crypto knowledge",
      href: "/puzzle/quiz",
      difficulty: quizPuzzle.difficulty,
      points: quizPuzzle.points,
      icon: "🧩",
    },
  ];

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center mt-6 px-4">
      <div className="text-center mb-16 max-w-3xl">
        <h1 className="text-6xl font-bold mb-6 gradient-text animate-gradient-flow">
          Web3 Word Puzzle
        </h1>
        <p className="text-xl text-white/80">
          Dive into the world of crypto through engaging puzzles. Learn, solve, and earn rewards on your journey.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-7xl">
        {puzzles.map((puzzle) => (
          <Link href={puzzle.href} key={puzzle.title} className="hover-card">
            <Card className="glass-card h-full">
              <CardHeader>
                <div className="text-4xl mb-4">{puzzle.icon}</div>
                <CardTitle className="text-2xl gradient-text">{puzzle.title}</CardTitle>
                <CardDescription className="text-white/70">{puzzle.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm text-white bg-white/5 px-3 py-1 rounded-full">
                    {puzzle.difficulty}
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {puzzle.points} points
                  </span>
                </div>
                <Button className="w-full button-glow bg-gradient-primary text-black font-bold">
                  Play Now
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
