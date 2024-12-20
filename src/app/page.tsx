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
    },
    {
      title: "Anagram",
      description: "Unscramble crypto terms",
      href: "/puzzle/anagram",
      difficulty: anagramPuzzle.difficulty,
      points: anagramPuzzle.points,
    },
    {
      title: "Quiz",
      description: "Test your crypto knowledge",
      href: "/puzzle/quiz",
      difficulty: quizPuzzle.difficulty,
      points: quizPuzzle.points,
    },
  ];

  return (
    <div className="py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Crypto Word Puzzle</h1>
        <p className="text-muted-foreground">
          Solve puzzles, earn points, and learn about crypto!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {puzzles.map((puzzle) => (
          <Card
            key={puzzle.title}
            className="hover:shadow-lg transition-shadow"
          >
            <CardHeader>
              <CardTitle>{puzzle.title}</CardTitle>
              <CardDescription>{puzzle.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-muted-foreground">
                  Difficulty: {puzzle.difficulty}
                </span>
                <span className="text-sm font-semibold">
                  {puzzle.points} points
                </span>
              </div>
              <Link href={puzzle.href}>
                <Button className="w-full">Play Now</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
