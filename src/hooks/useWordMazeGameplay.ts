import { useState } from "react";
import type { MazeWord } from "@/lib/word-maze";

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
  lives: 3,
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
    if (choice === current.meaning) {
      setState((previous) => ({
        ...previous,
        moves: previous.moves + 1,
        selectedChoice: choice,
        score: previous.score + 10,
        feedback: "correct",
      }));
      return false;
    }
    const remainingLives = state.lives - 1;
    setState((previous) => ({
      ...previous,
      moves: previous.moves + 1,
      selectedChoice: choice,
      lives: previous.lives - 1,
      feedback: "wrong",
    }));
    return remainingLives === 0;
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
