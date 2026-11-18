import { useMemo, useState } from "react";
import { createSentenceBuilderTiles, type SentenceBuilderQuestion, type SentenceBuilderTile } from "@/lib/sentence-builder";
import { getSentenceBuilderAnswerOutcome } from "@/lib/sentence-builder-answer";

interface SentenceBuilderState {
  round: SentenceBuilderQuestion[];
  index: number;
  tiles: SentenceBuilderTile[];
  chosen: SentenceBuilderTile[];
  score: number;
  correctCount: number;
  moves: number;
  hints: number;
  feedback: string;
  solved: boolean;
}

const initialState: SentenceBuilderState = {
  round: [],
  index: 0,
  tiles: [],
  chosen: [],
  score: 0,
  correctCount: 0,
  moves: 0,
  hints: 3,
  feedback: "",
  solved: false,
};

export function useSentenceBuilderGameplay() {
  const [state, setState] = useState(initialState);
  const current = state.round[state.index];
  const chosenTileIds = useMemo(() => new Set(state.chosen.map((tile) => tile.id)), [state.chosen]);

  function startRound(nextRound: SentenceBuilderQuestion[]) {
    setState({
      ...initialState,
      round: nextRound,
      tiles: createSentenceBuilderTiles(nextRound[0]),
    });
  }

  function choose(tile: SentenceBuilderTile) {
    if (state.solved || chosenTileIds.has(tile.id)) return;
    setState((previous) => ({
      ...previous,
      chosen: [...previous.chosen, tile],
      feedback: "",
    }));
  }

  function removeTile(tileId: number) {
    setState((previous) => ({
      ...previous,
      chosen: previous.chosen.filter((tile) => tile.id !== tileId),
      feedback: "",
    }));
  }

  function removeLastTile() {
    setState((previous) => ({
      ...previous,
      chosen: previous.chosen.slice(0, -1),
      feedback: "",
    }));
  }

  function submit() {
    if (!current || state.solved || !state.chosen.length) return;
    const answer = state.chosen.map((tile) => tile.text).join(" ");
    setState((previous) => ({
      ...previous,
      ...getSentenceBuilderAnswerOutcome({
        answer,
        expectedAnswer: current.answer_tokens.join(" "),
        moves: previous.moves,
        score: previous.score,
        correctCount: previous.correctCount,
      }),
    }));
  }

  function useHint() {
    if (!current || state.solved || state.hints < 1) return;
    const expected = current.answer_tokens[state.chosen.length];
    const tile = state.tiles.find((item) => item.text === expected && !chosenTileIds.has(item.id));
    if (!tile) return;
    setState((previous) => ({
      ...previous,
      chosen: [...previous.chosen, tile],
      hints: previous.hints - 1,
      feedback: "Hint added the next word tile.",
    }));
  }

  function nextQuestion(): boolean {
    if (state.index + 1 >= state.round.length) return true;
    const nextIndex = state.index + 1;
    const nextTiles = createSentenceBuilderTiles(state.round[nextIndex]);
    setState((previous) => ({
      ...previous,
      index: nextIndex,
      chosen: [],
      tiles: nextTiles,
      feedback: "",
      solved: false,
    }));
    return false;
  }

  return {
    round: state.round,
    index: state.index,
    tiles: state.tiles,
    chosen: state.chosen,
    score: state.score,
    correctCount: state.correctCount,
    moves: state.moves,
    hints: state.hints,
    feedback: state.feedback,
    solved: state.solved,
    current,
    startRound, choose, removeTile, removeLastTile, submit, useHint, nextQuestion,
  };
}
