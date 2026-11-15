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
    isLoaded,
    setup: {
      gridSize,
      setGridSize,
      difficulty,
      setDifficulty,
      category,
      setCategory,
      categoriesExpanded,
      toggleCategoriesExpanded: () => setCategoriesExpanded((expanded) => !expanded),
      tab: navigation.tab,
      categoryOptions,
      targetCount,
      showStickyStart,
      gameError,
      startGame: gameplay.handleStartGame,
      openPlayTab: navigation.openPlayTab,
      openHistoryTab: navigation.openHistoryTab,
    },
    history: {
      selected: navigation.selectedHistory,
      select: navigation.setSelectedHistory,
      sessions: history,
      page: historyPage,
      total: historyTotal,
      loading: historyLoading,
      error: historyError,
      load: loadHistory,
      fastestSeconds: fastestHistorySeconds,
      averageWordsPerRound,
      vocabularyByWord,
      view: navigation.viewHistory,
      changePage: navigation.changeHistoryPage,
    },
    game: {
      phase,
      puzzle,
      foundIds,
      foundWordPaths,
      elapsedSeconds,
      saveState,
      saveError,
      retrySave,
      vocabularyById,
      selectedCells: gameplay.selectedCells,
      clearSelection: gameplay.clearSelection,
      onPointerDown: gameplay.handleGridPointerDown,
      onPointerMove: gameplay.handleGridPointerMove,
      onPointerUp: gameplay.handleGridPointerUp,
      onPointerCancel: gameplay.handleGridPointerCancel,
      backToSetup: gameplay.backToSetup,
    },
  };
}
