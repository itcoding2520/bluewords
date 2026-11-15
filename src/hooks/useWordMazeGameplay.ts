import { useState } from "react";
import type { MazeWord } from "@/lib/word-maze";

type Feedback = "correct" | "wrong" | null;

export function useWordMazeGameplay() {
  const [round, setRound] = useState<MazeWord[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [won, setWon] = useState(false);
  const [moves, setMoves] = useState(0);

  const current = round[questionIndex];
  const pathProgress = questionIndex + (feedback === "correct" ? 1 : 0);
  const solvedCount = questionIndex + (feedback === "correct" ? 1 : 0);

  function startRound(nextRound: MazeWord[]) {
    setRound(nextRound);
    setQuestionIndex(0);
    setScore(0);
    setLives(3);
    setFeedback(null);
    setSelectedChoice(null);
    setWon(false);
    setMoves(0);
  }

  function chooseAnswer(choice: string): boolean {
    if (!current || feedback === "correct" || selectedChoice === choice) return false;
    setMoves((value) => value + 1);
    setSelectedChoice(choice);
    if (choice === current.meaning) {
      setScore((value) => value + 10);
      setFeedback("correct");
      return false;
    }
    const remainingLives = lives - 1;
    setLives(remainingLives);
    setFeedback("wrong");
    return remainingLives === 0;
  }

  function continuePath(): boolean {
    if (questionIndex >= round.length - 1) {
      setWon(true);
      return true;
    }
    setQuestionIndex((index) => index + 1);
    setFeedback(null);
    setSelectedChoice(null);
    return false;
  }

  return {
    round,
    questionIndex,
    score,
    lives,
    feedback,
    selectedChoice,
    won,
    moves,
    current,
    pathProgress,
    solvedCount,
    startRound,
    chooseAnswer,
    continuePath,
  };
}
