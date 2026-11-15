import { useMemo, useState } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { getVocabularyDropdownCategories } from "@/lib/vocabulary/category-dropdown";
import { useGameSessionTracking } from "@/hooks/useGameSessionTracking";

type Phase = "setup" | "playing" | "results";
export type MazeWord = { id: string; word: string; meaning: string; category: string; choices: string[] };
type Feedback = "correct" | "wrong" | null;

function shuffle<T>(items: T[]) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function getMeaning(word: VocabularyWord) {
  return word.detailedMeanings?.find((item) => item.meaning.trim())?.meaning.trim()
    || word.meaning.trim();
}

function makeRound(words: VocabularyWord[], category: string): MazeWord[] {
  const seenWords = new Set<string>();
  const seenMeanings = new Set<string>();
  const available = words.flatMap((word) => {
    const text = word.word.trim();
    const meaning = getMeaning(word);
    const meaningKey = meaning.toLocaleLowerCase();
    if (!text || !meaning || (category !== "all" && word.category !== category)
      || seenWords.has(text.toLocaleLowerCase()) || seenMeanings.has(meaningKey)) return [];
    seenWords.add(text.toLocaleLowerCase());
    seenMeanings.add(meaningKey);
    return [{ id: word.id, word: text, meaning, category: word.category }];
  });
  const chosen = shuffle(available).slice(0, 5);
  return chosen.map((answer) => {
    const distractors = shuffle(available.filter((word) =>
      word.id !== answer.id && word.meaning.toLocaleLowerCase() !== answer.meaning.toLocaleLowerCase()
    )).slice(0, 3).map((word) => word.meaning);
    return { ...answer, choices: shuffle([answer.meaning, ...distractors]) };
  });
}

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
      const meaning = getMeaning(word);
      const key = meaning.toLocaleLowerCase();
      if (!meaning || (category !== "all" && word.category !== category) || meanings.has(key)) continue;
      meanings.add(key);
      result.push(word);
    }
    return result;
  }, [category, words]);
  const categoryDropdownCategories = useMemo(
    () => getVocabularyDropdownCategories(categories, words, true),
    [categories, words]
  );
  const current = round[questionIndex];
  const pathProgress = questionIndex + (feedback === "correct" ? 1 : 0);
  const solvedCount = questionIndex + (feedback === "correct" ? 1 : 0);

  function startGame() {
    const nextRound = makeRound(words, category);
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
