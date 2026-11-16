import { useState } from "react";
import {
  createScrambledTiles,
  type LetterTile,
  type ScrambleWord,
} from "@/lib/word-scramble";

export function useWordScrambleGameplay() {
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

  const currentWord = round[questionIndex];
  const usedTileIds = new Set(answerTileIds);

  function startRound(nextRound: ScrambleWord[]) {
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

  function nextQuestion(): boolean {
    if (questionIndex + 1 >= round.length) {
      return true;
    }
    const nextIndex = questionIndex + 1;
    setQuestionIndex(nextIndex);
    setLetterTiles(createScrambledTiles(round[nextIndex].answer));
    setAnswerTileIds([]);
    setHintUsed(false);
    setFeedback("");
    setIsCorrect(false);
    return false;
  }

  return {
    round,
    questionIndex,
    letterTiles,
    answerTileIds,
    score,
    streak,
    bestStreak,
    hintsLeft,
    hintUsed,
    feedback,
    isCorrect,
    currentWord,
    usedTileIds,
    moves,
    startRound,
    chooseLetter,
    removeLetter,
    useHint,
    nextQuestion,
  };
}
