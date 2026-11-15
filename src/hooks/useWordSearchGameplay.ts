import type { Dispatch, SetStateAction } from "react";

import { useWordSearchSelection, type CellPosition } from "@/hooks/useWordSearchSelection";
import { createWordSearchPuzzle } from "@/lib/word-search.mjs";
import { findWordSearchSelectionPrefix } from "@/lib/word-search-selection.mjs";
import type { GridSize } from "@/lib/word-search-config";

type Phase = "setup" | "playing" | "results";
type Puzzle = ReturnType<typeof createWordSearchPuzzle>;
type Candidate = { id: string; word: string };

interface UseWordSearchGameplayOptions {
  phase: Phase;
  setPhase: Dispatch<SetStateAction<Phase>>;
  puzzle: Puzzle | null;
  setPuzzle: Dispatch<SetStateAction<Puzzle | null>>;
  foundIds: Set<string>;
  setFoundIds: Dispatch<SetStateAction<Set<string>>>;
  setFoundWordPaths: Dispatch<SetStateAction<Record<string, CellPosition[]>>>;
  candidates: Candidate[];
  gridSize: GridSize;
  targetCount: number;
  setStartedAt: Dispatch<SetStateAction<number | null>>;
  setGameError: Dispatch<SetStateAction<string>>;
  resetTimer: () => void;
  resetSave: () => void;
}

export function useWordSearchGameplay({
  phase,
  setPhase,
  puzzle,
  setPuzzle,
  foundIds,
  setFoundIds,
  setFoundWordPaths,
  candidates,
  gridSize,
  targetCount,
  setStartedAt,
  setGameError,
  resetTimer,
  resetSave,
}: UseWordSearchGameplayOptions) {
  function finishCellSelection(selection: CellPosition[]) {
    if (!puzzle || phase !== "playing" || selection.length < 2) {
      clearSelection();
      return;
    }
    const match = findWordSearchSelectionPrefix(puzzle, selection, foundIds);
    if (!match?.complete) {
      clearSelection();
      return;
    }

    const nextFoundIds = new Set(foundIds);
    nextFoundIds.add(match.word.id);
    setFoundIds(nextFoundIds);
    setFoundWordPaths((paths) => ({ ...paths, [match.word.id]: selection }));
    clearSelection();

    if (nextFoundIds.size === puzzle.words.length) {
      setPhase("results");
    }
  }

  const {
    selectedCells,
    clearSelection,
    handlePointerDown: handleGridPointerDown,
    handlePointerMove: handleGridPointerMove,
    handlePointerUp: handleGridPointerUp,
    handlePointerCancel: handleGridPointerCancel,
  } = useWordSearchSelection({
    enabled: phase === "playing",
    onSelectionComplete: finishCellSelection,
  });

  function handleStartGame() {
    const nextPuzzle = createWordSearchPuzzle(candidates, gridSize, targetCount);
    if (nextPuzzle.words.length === 0) {
      setGameError("We couldn't build a board from this selection. Try a different category or difficulty.");
      return;
    }
    setPuzzle(nextPuzzle);
    setFoundIds(new Set());
    setFoundWordPaths({});
    clearSelection();
    resetTimer();
    resetSave();
    setStartedAt(Date.now());
    setGameError("");
    setPhase("playing");
  }

  function backToSetup() {
    clearSelection();
    setStartedAt(null);
    setPhase("setup");
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
