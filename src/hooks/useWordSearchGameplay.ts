import type { GamePhase } from "@/types/game";
import type { Dispatch, SetStateAction } from "react";

import { useWordSearchSelection, type CellPosition } from "@/hooks/useWordSearchSelection";
import { createWordSearchPuzzle } from "@/lib/word-search.mjs";
import { findWordSearchSelectionPrefix } from "@/lib/word-search-selection.mjs";
import type { GridSize } from "@/lib/word-search-config";

type Phase = GamePhase;
type Puzzle = ReturnType<typeof createWordSearchPuzzle>;
type Candidate = { id: string; word: string };

export interface WordSearchGameplayState {
  phase: Phase;
  puzzle: Puzzle | null;
  foundIds: Set<string>;
  foundWordPaths: Record<string, CellPosition[]>;
  startedAt: number | null;
  gameError: string;
}

interface UseWordSearchGameplayOptions {
  state: WordSearchGameplayState;
  setState: Dispatch<SetStateAction<WordSearchGameplayState>>;
  candidates: Candidate[];
  gridSize: GridSize;
  targetCount: number;
  resetTimer: () => void;
  resetSave: () => void;
}

export function useWordSearchGameplay({
  state,
  setState,
  candidates,
  gridSize,
  targetCount,
  resetTimer,
  resetSave,
}: UseWordSearchGameplayOptions) {
  function finishCellSelection(selection: CellPosition[]) {
    if (!state.puzzle || state.phase !== "playing" || selection.length < 2) {
      clearSelection();
      return;
    }
    const match = findWordSearchSelectionPrefix(state.puzzle, selection, state.foundIds);
    if (!match?.complete) {
      clearSelection();
      return;
    }

    const nextFoundIds = new Set(state.foundIds);
    nextFoundIds.add(match.word.id);
    const isComplete = nextFoundIds.size === state.puzzle.words.length;
    setState((current) => ({
      ...current,
      foundIds: nextFoundIds,
      foundWordPaths: { ...current.foundWordPaths, [match.word.id]: selection },
      phase: isComplete ? "results" : current.phase,
    }));
    clearSelection();
  }

  const {
    selectedCells,
    clearSelection,
    handlePointerDown: handleGridPointerDown,
    handlePointerMove: handleGridPointerMove,
    handlePointerUp: handleGridPointerUp,
    handlePointerCancel: handleGridPointerCancel,
  } = useWordSearchSelection({
    enabled: state.phase === "playing",
    onSelectionComplete: finishCellSelection,
  });

  function handleStartGame() {
    const nextPuzzle = createWordSearchPuzzle(candidates, gridSize, targetCount);
    if (nextPuzzle.words.length === 0) {
      setState((current) => ({
        ...current,
        gameError: "We couldn't build a board from this selection. Try a different category or difficulty.",
      }));
      return;
    }
    clearSelection();
    resetTimer();
    resetSave();
    const startedAt = Date.now();
    setState((current) => ({
      ...current,
      phase: "playing",
      puzzle: nextPuzzle,
      foundIds: new Set(),
      foundWordPaths: {},
      startedAt,
      gameError: "",
    }));
  }

  function backToSetup() {
    clearSelection();
    setState((current) => ({ ...current, startedAt: null, phase: "setup" }));
  }

  return {
    selectedCells,
    clearSelection,
    handleGridPointerDown,
    handleGridPointerMove,
    handleGridPointerUp,
    handleGridPointerCancel,
    handleStartGame,
    backToSetup,
  };
}
