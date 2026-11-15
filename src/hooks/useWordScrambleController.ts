import { useMemo, useState } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { getVocabularyDropdownCategories } from "@/lib/vocabulary/category-dropdown";
import { useGameSessionTracking } from "@/hooks/useGameSessionTracking";
import { shuffle } from "@/lib/quiz-random";
import {
  buildWordScrambleCandidates,
  createScrambledTiles,
  type LetterTile,
  type ScrambleWord,
} from "@/lib/word-scramble";

export type { ScrambleWord, LetterTile } from "@/lib/word-scramble";

type Phase = "setup" | "playing" | "results";
type QuestionCount = 5 | 10;

export function useWordScrambleController(input: {
  words: VocabularyWord[];
  categories: VocabularyCategoryRow[];
  isAuthenticated: boolean;
}) {
  const { words, categories, isAuthenticated } = input;
  const [category, setCategory] = useState("all");
  const [questionCount, setQuestionCount] = useState<QuestionCount>(10);
  const [phase, setPhase] = useState<Phase>("setup");
  const [round, setRound] = useState<ScrambleWord[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [letterTiles, setLetterTiles] = useState<LetterTile[]>([]);
  const [answerTileIds, setAnswerTileIds] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [moves, setMoves] = useState(0);
  const [hintsLeft, setHintsLeft] = useState(3);
  const [hintUsed, setHintUsed] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const session = useGameSessionTracking({
    isAuthenticated,
    isPlaying: phase === "playing",
    shouldSubmit: phase === "results",
    gameType: "word-scramble",
    roundSize: round.length,
    score,
    correctCount: round.length,
    moves,
    startedAt,
  });

  const candidates = useMemo(() => buildWordScrambleCandidates(words, category), [category, words]);
  const categoryDropdownCategories = useMemo(
    () => getVocabularyDropdownCategories(categories, words),
    [categories, words]
  );
  const currentWord = round[questionIndex];
  const usedTileIds = new Set(answerTileIds);
  const timeLabel = `${Math.floor(session.elapsedSeconds / 60)}:${String(session.elapsedSeconds % 60).padStart(2, "0")}`;

  function startRound() {
    if (candidates.length < questionCount) return;
    const nextRound = shuffle(candidates).slice(0, questionCount);
    setRound(nextRound);
    setQuestionIndex(0);
    setLetterTiles(createScrambledTiles(nextRound[0].answer));
    setAnswerTileIds([]);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setMoves(0);
    setHintsLeft(3);
    setHintUsed(false);
    setFeedback("");
    setIsCorrect(false);
    session.resetSession();
    setStartedAt(Date.now());
    setPhase("playing");
  }

  function submitAnswer(nextIds: number[], usedHint = hintUsed) {
    setMoves((count) => count + 1);
    const answer = nextIds.map((id) => letterTiles.find((tile) => tile.id === id)?.letter ?? "").join("");
    if (answer.length !== currentWord.answer.length) return;
    if (answer === currentWord.answer) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setBestStreak((best) => Math.max(best, nextStreak));
      setScore((value) => value + (usedHint ? 10 : 20));
      setFeedback(`Great job! ${currentWord.word} is correct!`);
      setIsCorrect(true);
    } else {
      setStreak(0);
      setFeedback("Almost! Rearrange the letters and try again.");
      setIsCorrect(false);
    }
  }

  function chooseLetter(tileId: number) {
    if (isCorrect || usedTileIds.has(tileId)) return;
    const nextIds = [...answerTileIds, tileId];
    setAnswerTileIds(nextIds);
    if (nextIds.length === currentWord.answer.length) submitAnswer(nextIds);
  }

  function removeLetter(tileId?: number) {
    if (isCorrect || answerTileIds.length === 0) return;
    const nextIds = tileId === undefined
      ? answerTileIds.slice(0, -1)
      : answerTileIds.filter((id) => id !== tileId);
    setAnswerTileIds(nextIds);
    setFeedback("");
  }

  function useHint() {
    if (isCorrect || hintsLeft <= 0) return;
    const nextPosition = answerTileIds.length;
    const neededLetter = currentWord.answer[nextPosition];
    const tile = letterTiles.find((item) => !usedTileIds.has(item.id) && item.letter === neededLetter);
    if (!tile) return;
    const nextIds = [...answerTileIds, tile.id];
    setAnswerTileIds(nextIds);
    setHintsLeft((count) => count - 1);
    setHintUsed(true);
    setFeedback("Hint used: one letter placed. This answer is worth 10 points.");
    if (nextIds.length === currentWord.answer.length) submitAnswer(nextIds, true);
  }

  function nextQuestion() {
    if (questionIndex + 1 >= round.length) {
      session.setElapsedSeconds(startedAt === null
        ? 0
        : Math.floor((Date.now() - startedAt) / 1000));
      setPhase("results");
      return;
    }
    const nextIndex = questionIndex + 1;
    setQuestionIndex(nextIndex);
    setLetterTiles(createScrambledTiles(round[nextIndex].answer));
    setAnswerTileIds([]);
    setHintUsed(false);
    setFeedback("");
    setIsCorrect(false);
  }

  return {
    category, setCategory, questionCount, setQuestionCount, phase,
    round, questionIndex, letterTiles, answerTileIds, score, streak,
    bestStreak, hintsLeft, hintUsed, feedback, isCorrect, candidates,
    categoryDropdownCategories, currentWord, usedTileIds, timeLabel,
    saveState: session.saveState,
    saveError: session.saveError,
    retrySave: session.retrySave,
    startRound, chooseLetter, removeLetter, useHint, nextQuestion,
  };
}
