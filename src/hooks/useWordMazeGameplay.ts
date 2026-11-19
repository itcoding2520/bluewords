import { useState } from "react";
import { WORD_MAZE_LIVES, type MazeWord } from "@/lib/word-maze";
import { getWordMazeAnswerOutcome } from "@/lib/word-maze-answer";

type Feedback = "correct" | "wrong" | null;

interface WordMazeState {
  round: MazeWord[];
  questionIndex: number;
  score: number;
  lives: number;
  feedback: Feedback;
  selectedChoice: string | null;
  won: boolean;
  moves: number;
}

const initialState: WordMazeState = {
  round: [],
  questionIndex: 0,
  score: 0,
  lives: WORD_MAZE_LIVES,
  feedback: null,
  selectedChoice: null,
  won: false,
  moves: 0,
};

export function useWordMazeGameplay() {
  const [state, setState] = useState(initialState);

  const current = state.round[state.questionIndex];
  const progress = state.questionIndex + (state.feedback === "correct" ? 1 : 0);

  function startRound(nextRound: MazeWord[]) {
    setState({ ...initialState, round: nextRound });
  }

  function chooseAnswer(choice: string): boolean {
    if (!current || state.feedback === "correct" || state.selectedChoice === choice) return false;
    const isCorrect = choice === current.meaning;
    setState((previous) => ({
      ...previous,
      ...getWordMazeAnswerOutcome({
        choice,
        isCorrect,
        moves: previous.moves,
        score: previous.score,
        lives: previous.lives,
      }),
    }));
    return !isCorrect && state.lives - 1 === 0;
  }

  function continuePath(): boolean {
    if (state.questionIndex >= state.round.length - 1) {
      setState((previous) => ({ ...previous, won: true }));
      return true;
    }
    setState((previous) => ({
      ...previous,
      questionIndex: previous.questionIndex + 1,
      feedback: null,
      selectedChoice: null,
    }));
    return false;
  }

  return {
    round: state.round,
    questionIndex: state.questionIndex,
    score: state.score,
    lives: state.lives,
    feedback: state.feedback,
    selectedChoice: state.selectedChoice,
    won: state.won,
    moves: state.moves,
    current,
    progress,
    startRound,
    chooseAnswer,
    continuePath,
  };
}
