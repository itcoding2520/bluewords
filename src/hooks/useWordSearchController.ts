import { useState } from "react";
import { useVocabulary } from "@/contexts/VocabularyContext";
import { type CellPosition } from "@/hooks/useWordSearchSelection";
import { useWordSearchHistory } from "@/hooks/useWordSearchHistory";
import { useWordSearchSessionSave } from "@/hooks/useWordSearchSessionSave";
import { useWordSearchTimer } from "@/hooks/useWordSearchTimer";
import { createWordSearchPuzzle } from "@/lib/word-search.mjs";
import { type Difficulty, type GridSize } from "@/lib/word-search-config";
import { useWordSearchGameData } from "@/hooks/useWordSearchGameData";
import { useWordSearchGameplay } from "@/hooks/useWordSearchGameplay";
import { useWordSearchNavigation } from "@/hooks/useWordSearchNavigation";

type Phase = "setup" | "playing" | "results";

export function useWordSearchController(userId: string | null) {
  const { words, categories, isLoaded } = useVocabulary();
  const [gridSize, setGridSize] = useState<GridSize>(10);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [category, setCategory] = useState("all");
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [phase, setPhase] = useState<Phase>("setup");
  const [puzzle, setPuzzle] = useState<ReturnType<typeof createWordSearchPuzzle> | null>(null);
  const [foundIds, setFoundIds] = useState<Set<string>>(() => new Set());
  const [foundWordPaths, setFoundWordPaths] = useState<Record<string, CellPosition[]>>({});
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [gameError, setGameError] = useState("");
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
  const navigation = useWordSearchNavigation({ setPhase, setHistoryPage, loadHistory });

  const {
    candidates,
    vocabularyById,
    vocabularyByWord,
    categoryOptions,
    targetCount,
    showStickyStart,
  } = useWordSearchGameData({ words, categories, category, difficulty, gridSize, phase, tab: navigation.tab });

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
    tab: navigation.tab,
    puzzle,
    foundIds,
    foundWordPaths,
    selectedHistory: navigation.selectedHistory,
    setSelectedHistory: navigation.setSelectedHistory,
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
    openPlayTab: navigation.openPlayTab,
    openHistoryTab: navigation.openHistoryTab,
    viewHistory: navigation.viewHistory,
    changeHistoryPage: navigation.changeHistoryPage,
  };
}
