import { useMemo, useState } from "react";
import {
  createScrambledTiles,
  type LetterTile,
  type ScrambleWord,
} from "@/lib/word-scramble";
import { getWordScrambleAnswerOutcome } from "@/lib/word-scramble-score";

interface WordScrambleState {
  round: ScrambleWord[];
  questionIndex: number;
  letterTiles: LetterTile[];
  answerTileIds: number[];
  score: number;
  streak: number;
  bestStreak: number;
  moves: number;
  hintsLeft: number;
  hintUsed: boolean;
  feedback: string;
  isCorrect: boolean;
}

const initialState: WordScrambleState = {
  round: [],
  questionIndex: 0,
  letterTiles: [],
  answerTileIds: [],
  score: 0,
  streak: 0,
  bestStreak: 0,
  moves: 0,
  hintsLeft: 3,
  hintUsed: false,
  feedback: "",
  isCorrect: false,
};

export function useWordScrambleGameplay() {
  const [state, setState] = useState(initialState);

  const currentWord = state.round[state.questionIndex];
  const usedTileIds = useMemo(() => new Set(state.answerTileIds), [state.answerTileIds]);
  const lettersByTileId = useMemo(
    () => {
      const letters = new Map<number, string>();
      for (const tile of state.letterTiles) letters.set(tile.id, tile.letter);
      return letters;
    },
    [state.letterTiles],
  );

  function startRound(nextRound: ScrambleWord[]) {
    setState({
      ...initialState,
      round: nextRound,
      letterTiles: createScrambledTiles(nextRound[0].answer),
    });
  }

  function submitAnswer(nextIds: number[], usedHint = state.hintUsed) {
    const answer = nextIds.map((id) => lettersByTileId.get(id) ?? "").join("");
    if (answer.length !== currentWord.answer.length) {
      setState((current) => ({ ...current, moves: current.moves + 1 }));
      return;
    }

    setState((current) => ({
      ...current,
      ...getWordScrambleAnswerOutcome({
        answer,
        expectedAnswer: currentWord.answer,
        displayWord: currentWord.word,
        usedHint,
        moves: current.moves,
        streak: current.streak,
        bestStreak: current.bestStreak,
        score: current.score,
      }),
    }));
  }

  function chooseLetter(tileId: number) {
    if (state.isCorrect || usedTileIds.has(tileId)) return;
    const nextIds = [...state.answerTileIds, tileId];
    setState((current) => ({ ...current, answerTileIds: nextIds }));
    if (nextIds.length === currentWord.answer.length) submitAnswer(nextIds);
  }

  function removeLetter(tileId?: number) {
    if (state.isCorrect || state.answerTileIds.length === 0) return;
    const nextIds = tileId === undefined
      ? state.answerTileIds.slice(0, -1)
      : state.answerTileIds.filter((id) => id !== tileId);
    setState((current) => ({ ...current, answerTileIds: nextIds, feedback: "" }));
  }

  function useHint() {
    if (state.isCorrect || state.hintsLeft <= 0) return;
    const nextPosition = state.answerTileIds.length;
    const neededLetter = currentWord.answer[nextPosition];
    const tile = state.letterTiles.find((item) => !usedTileIds.has(item.id) && item.letter === neededLetter);
    if (!tile) return;
    const nextIds = [...state.answerTileIds, tile.id];
    setState((current) => ({
      ...current,
      answerTileIds: nextIds,
      hintsLeft: current.hintsLeft - 1,
      hintUsed: true,
      feedback: "Hint used: one letter placed. This answer is worth 10 points.",
    }));
    if (nextIds.length === currentWord.answer.length) submitAnswer(nextIds, true);
  }

  function nextQuestion(): boolean {
    if (state.questionIndex + 1 >= state.round.length) {
      return true;
    }
    const nextIndex = state.questionIndex + 1;
    const nextTiles = createScrambledTiles(state.round[nextIndex].answer);
    setState((current) => ({
      ...current,
      questionIndex: nextIndex,
      letterTiles: nextTiles,
      answerTileIds: [],
      hintUsed: false,
      feedback: "",
      isCorrect: false,
    }));
    return false;
  }

  return {
    round: state.round,
    questionIndex: state.questionIndex,
    letterTiles: state.letterTiles,
    answerTileIds: state.answerTileIds,
    score: state.score,
    streak: state.streak,
    bestStreak: state.bestStreak,
    hintsLeft: state.hintsLeft,
    hintUsed: state.hintUsed,
    feedback: state.feedback,
    isCorrect: state.isCorrect,
    currentWord,
    usedTileIds,
    lettersByTileId,
    moves: state.moves,
    startRound,
    chooseLetter,
    removeLetter,
    useHint,
    nextQuestion,
  };
}
