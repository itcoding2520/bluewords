import { useMemo, useState } from "react";
import { useVocabulary } from "@/contexts/VocabularyContext";
import type { WordSearchSessionRow } from "@/types/database";
import { useWordSearchSelection, type CellPosition } from "@/hooks/useWordSearchSelection";
import { useWordSearchHistory } from "@/hooks/useWordSearchHistory";
import { useWordSearchSessionSave } from "@/hooks/useWordSearchSessionSave";
import { useWordSearchTimer } from "@/hooks/useWordSearchTimer";
import { createWordSearchPuzzle, findWordSearchSelectionPrefix, normalizeWordSearchWord } from "@/lib/word-search.mjs";
import { WORD_TARGETS, selectableWords, buildWordSearchCategoryOptions, type Difficulty, type GridSize } from "@/lib/word-search-config";

type Phase = "setup" | "playing" | "results";
type Tab = "play" | "history";

function currentTimestamp() {
  return Date.now();
}

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

  const candidates = useMemo(() => selectableWords(words, category, difficulty, gridSize), [words, category, difficulty, gridSize]);
  const vocabularyById = useMemo(() => new Map(words.map((word) => [word.id, word] as const)), [words]);
  const vocabularyByWord = useMemo(() => new Map(words.map((word) => [normalizeWordSearchWord(word.word), word] as const)), [words]);
  const categoryOptions = useMemo(
    () => buildWordSearchCategoryOptions(categories, words),
    [categories, words]
  );
  const targetCount = Math.min(WORD_TARGETS[gridSize][difficulty], candidates.length);
  const showStickyStart = phase === "setup" && tab === "play";

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
    setStartedAt(currentTimestamp());
    setGameError("");
    setPhase("playing");
  }

  function backToSetup() {
    clearSelection();
    setStartedAt(null);
    setPhase("setup");
  }

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
    setPhase,
    tab,
    setTab,
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
    setHistoryPage,
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
