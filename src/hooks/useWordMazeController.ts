import { useMemo, useState } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { useVocabularyDropdownCategories } from "@/hooks/useVocabularyDropdownCategories";
import { useGameSessionTracking } from "@/hooks/useGameSessionTracking";
import { buildWordMazeRound, type MazeWord } from "@/lib/word-maze";
import { getPrimaryVocabularyMeaning } from "@/lib/vocabulary/meaning";

type Phase = "setup" | "playing" | "results";
export type { MazeWord } from "@/lib/word-maze";
type Feedback = "correct" | "wrong" | null;

export function useWordMazeController(input: {
  words: VocabularyWord[];
  categories: VocabularyCategoryRow[];
  isAuthenticated: boolean;
}) {
  const { words, categories, isAuthenticated } = input;
  const [category, setCategory] = useState("all");
  const [phase, setPhase] = useState<Phase>("setup");
  const [round, setRound] = useState<MazeWord[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [won, setWon] = useState(false);
  const [moves, setMoves] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const session = useGameSessionTracking({
    isAuthenticated,
    isPlaying: phase === "playing",
    shouldSubmit: phase === "results" && won,
    gameType: "word-maze",
    roundSize: round.length,
    score,
    correctCount: round.length,
    moves,
    startedAt,
  });

  const candidates = useMemo(() => {
    const meanings = new Set<string>();
    const result: VocabularyWord[] = [];
    for (const word of words) {
      const meaning = getPrimaryVocabularyMeaning(word);
      const key = meaning.toLocaleLowerCase();
      if (!meaning || (category !== "all" && word.category !== category) || meanings.has(key)) continue;
      meanings.add(key);
      result.push(word);
    }
    return result;
  }, [category, words]);
  const categoryDropdownCategories = useVocabularyDropdownCategories(categories, words, true);
  const current = round[questionIndex];
  const pathProgress = questionIndex + (feedback === "correct" ? 1 : 0);
  const solvedCount = questionIndex + (feedback === "correct" ? 1 : 0);

  function startGame() {
    const nextRound = buildWordMazeRound(words, category);
    if (nextRound.length < 5 || nextRound.some((question) => question.choices.length < 4)) return;
    setRound(nextRound);
    setQuestionIndex(0);
    setScore(0);
    setLives(3);
    setFeedback(null);
    setSelectedChoice(null);
    setWon(false);
    setMoves(0);
    session.resetSession();
    setStartedAt(Date.now());
    setPhase("playing");
  }

  function chooseAnswer(choice: string) {
    if (!current || feedback === "correct" || selectedChoice === choice) return;
    setMoves((value) => value + 1);
    setSelectedChoice(choice);
    if (choice === current.meaning) {
      setScore((value) => value + 10);
      setFeedback("correct");
      return;
    }
    const remainingLives = lives - 1;
    setLives(remainingLives);
    setFeedback("wrong");
    if (remainingLives === 0) setPhase("results");
  }

  function continuePath() {
    if (questionIndex >= round.length - 1) {
      setWon(true);
      setPhase("results");
      return;
    }
    setQuestionIndex((index) => index + 1);
    setFeedback(null);
    setSelectedChoice(null);
  }

  return {
    category, setCategory, phase, setPhase, round, questionIndex, score, lives,
    feedback, selectedChoice, won, candidates, categoryDropdownCategories,
    current, pathProgress, solvedCount,
    elapsedSeconds: session.elapsedSeconds,
    saveState: session.saveState,
    saveError: session.saveError,
    retrySave: session.retrySave,
    startGame, chooseAnswer, continuePath,
  };
}
