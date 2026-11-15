import { useState } from "react";
import { useVocabulary } from "@/contexts/VocabularyContext";
import type { WordSearchSessionRow } from "@/types/database";
import { type CellPosition } from "@/hooks/useWordSearchSelection";
import { useWordSearchHistory } from "@/hooks/useWordSearchHistory";
import { useWordSearchSessionSave } from "@/hooks/useWordSearchSessionSave";
import { useWordSearchTimer } from "@/hooks/useWordSearchTimer";
import { createWordSearchPuzzle } from "@/lib/word-search.mjs";
import { type Difficulty, type GridSize } from "@/lib/word-search-config";
import { useWordSearchGameData } from "@/hooks/useWordSearchGameData";
import { useWordSearchGameplay } from "@/hooks/useWordSearchGameplay";

type Phase = "setup" | "playing" | "results";
type Tab = "play" | "history";

export function useWordSearchController(userId: string | null) {
  const { words, categories, isLoaded } = useVocabulary();
  const [gridSize, setGridSize] = useState<GridSize>(10);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [category, setCategory] = useState("all");
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [phase, setPhase] = useState<Phase>("setup");
  const [tab, setTab] = useState<Tab>("play");
  const [puzzle, setPuzzle] = useState<ReturnType<typeof createWordSearchPuzzle> | null>(null);
  const [foundIds, setFoundIds] = useState<Set<string>>(() => new Set());
  const [foundWordPaths, setFoundWordPaths] = useState<Record<string, CellPosition[]>>({});
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [gameError, setGameError] = useState("");
  const [selectedHistory, setSelectedHistory] = useState<WordSearchSessionRow | null>(null);
  const { elapsedSeconds, setElapsedSeconds, reset: resetTimer } = useWordSearchTimer(phase, startedAt);
  const { saveState, saveError, reset: resetSave, retry: retrySave } = useWordSearchSessionSave({
    userId,
    phase,
    startedAt,
    puzzle,
    gridSize,
    difficulty,
    category,
    onSaved: setElapsedSeconds,
  });
  const {
    history,
    historyPage,
    setHistoryPage,
    historyTotal,
    historyLoading,
    historyError,
    loadHistory,
    fastestSeconds: fastestHistorySeconds,
    averageWordsPerRound,
  } = useWordSearchHistory(userId);

  const {
    candidates,
    vocabularyById,
    vocabularyByWord,
    categoryOptions,
    targetCount,
    showStickyStart,
  } = useWordSearchGameData({ words, categories, category, difficulty, gridSize, phase, tab });

  const gameplay = useWordSearchGameplay({
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
  });

  function openPlayTab() {
    setTab("play");
    setSelectedHistory(null);
  }

  function openHistoryTab() {
    setTab("history");
    setSelectedHistory(null);
    void loadHistory();
  }

  function viewHistory() {
    setPhase("setup");
    setTab("history");
    setHistoryPage(1);
    setSelectedHistory(null);
    void loadHistory(true, 1);
  }

  function changeHistoryPage(page: number) {
    setHistoryPage(page);
    void loadHistory(false, page);
  }

  return {
    words,
    categories,
    isLoaded,
    gridSize,
    setGridSize,
    difficulty,
    setDifficulty,
    category,
    setCategory,
    categoriesExpanded,
    setCategoriesExpanded,
    phase,
    tab,
    puzzle,
    foundIds,
    foundWordPaths,
    selectedHistory,
    setSelectedHistory,
    elapsedSeconds,
    saveState,
    saveError,
    retrySave,
    history,
    historyPage,
    historyTotal,
    historyLoading,
    historyError,
    loadHistory,
    fastestHistorySeconds,
    averageWordsPerRound,
    vocabularyById,
    vocabularyByWord,
    categoryOptions,
    targetCount,
    showStickyStart,
    gameError,
    setGameError,
    selectedCells: gameplay.selectedCells,
    clearSelection: gameplay.clearSelection,
    handleGridPointerDown: gameplay.handleGridPointerDown,
    handleGridPointerMove: gameplay.handleGridPointerMove,
    handleGridPointerUp: gameplay.handleGridPointerUp,
    handleGridPointerCancel: gameplay.handleGridPointerCancel,
    handleStartGame: gameplay.handleStartGame,
    backToSetup: gameplay.backToSetup,
    openPlayTab,
    openHistoryTab,
    viewHistory,
    changeHistoryPage,
  };
}
