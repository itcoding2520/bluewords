"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Clock3, Gamepad2, History, Info, Star } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { WordSearchResults } from "@/components/games/WordSearchResults";
import { WordSearchWordList } from "@/components/games/WordSearchWordList";
import { WordSearchHistoryList } from "@/components/games/WordSearchHistoryList";
import { WordSearchSetupForm, type WordSearchCategoryOption } from "@/components/games/WordSearchSetupForm";
import { WordSearchHistoryDetail } from "@/components/games/WordSearchHistoryDetail";
import { Card } from "@/components/ui/Card";
import { useVocabulary } from "@/contexts/VocabularyContext";
import type { WordSearchSessionRow } from "@/types/database";
import { useWordSearchSelection, type CellPosition } from "@/hooks/useWordSearchSelection";
import { createWordSearchPuzzle, findWordSearchSelectionPrefix, normalizeWordSearchWord } from "@/lib/word-search.mjs";
import { PREVIEW_LETTERS, WORD_TARGETS, selectableWords, type Difficulty, type GridSize } from "@/lib/word-search-config";
import { getCachedWordSearchSessions, getWordSearchSessions, saveWordSearchSession } from "@/lib/supabase/word-search-history";

type Phase = "setup" | "playing" | "results";
type Tab = "play" | "history";

function currentTimestamp() {
  return Date.now();
}
function BoardPreview({ gridSize, difficulty, wordCount }: { gridSize: GridSize; difficulty: Difficulty; wordCount: number }) {
  return (
    <Card className="word-search-board-preview relative overflow-hidden border-indigo-100 bg-indigo-50/70 p-5 sm:p-7">
      <Image src="/images/ui/illustrations/hero-book-mascot.svg" alt="" width={130} height={110} className="word-search-preview-mascot" />
      <p className="relative z-10 text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-500">Your board preview</p>
      <h2 className="mt-3 text-xl font-bold text-slate-900">Ready when you are</h2>
      <p className="mt-1 text-sm text-slate-500">A fresh puzzle every round.</p>

      <div role="img" aria-label="Sample word search board with SEARCH highlighted" className="word-search-preview-grid relative z-10 mx-auto mt-5 grid max-w-sm grid-cols-8 gap-1 rounded-2xl border border-indigo-100 bg-white p-3">
        {PREVIEW_LETTERS.flatMap((row, rowIndex) => row.map((letter, columnIndex) => {
          const highlighted = rowIndex === 0 && columnIndex >= 1 && columnIndex <= 6;
          return <span key={`${rowIndex}-${columnIndex}`} className={`grid aspect-square place-items-center rounded-md border text-xs font-semibold sm:text-sm ${highlighted ? "border-indigo-200 bg-indigo-100 text-indigo-700" : "border-slate-100 bg-slate-50 text-slate-500"}`}>{letter}</span>;
        }))}
      </div>

      <div className="mt-5 border-t border-indigo-200/70 pt-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-indigo-500">Game settings</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[`${gridSize} × ${gridSize}`, difficulty[0].toUpperCase() + difficulty.slice(1), `${wordCount} ${wordCount === 1 ? "word" : "words"}`].map((setting) => <span key={setting} className="rounded-full border border-indigo-100 bg-white px-3 py-2 text-xs font-semibold text-slate-700">{setting}</span>)}
        </div>
        <p className="mt-5 flex items-center gap-2 text-xs text-slate-500"><Info size={16} className="shrink-0 text-indigo-400" /> Words are chosen from your vocabulary.</p>
      </div>
    </Card>
  );
}

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}


export function WordSearchContent({ userId }: { userId: string | null }) {
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
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [gameError, setGameError] = useState("");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState("");
  const [saveRetryCount, setSaveRetryCount] = useState(0);
  const [history, setHistory] = useState<WordSearchSessionRow[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [selectedHistory, setSelectedHistory] = useState<WordSearchSessionRow | null>(null);
  const saveStartedRef = useRef<number | null>(null);

  const candidates = useMemo(() => selectableWords(words, category, difficulty, gridSize), [words, category, difficulty, gridSize]);
  const vocabularyById = useMemo(() => new Map(words.map((word) => [word.id, word] as const)), [words]);
  const vocabularyByWord = useMemo(() => new Map(words.map((word) => [normalizeWordSearchWord(word.word), word] as const)), [words]);
  const categoryOptions = useMemo<WordSearchCategoryOption[]>(() => {
    const visibleCategories = categories.filter((item) => item.name.trim().toLowerCase() !== "uncategorized");
    return [
      { id: "all-categories", name: "All categories", value: "all", color: "blue", imagePath: null },
      ...visibleCategories.map((item) => ({
        id: item.id,
        name: item.name,
        value: item.name,
        color: item.color,
        imagePath: item.image_path ? `category:${item.image_path}` : words.find((word) => word.category === item.name && word.imagePath)?.imagePath ?? null,
      })),
    ];
  }, [categories, words]);
  const targetCount = Math.min(WORD_TARGETS[gridSize][difficulty], candidates.length);
  const fastestHistorySeconds = history.reduce<number | null>((best, item) => best === null || item.duration_seconds < best ? item.duration_seconds : best, null);
  const averageWordsPerRound = history.length ? Math.round(history.reduce((total, item) => total + item.word_count, 0) / history.length) : 0;
  const showStickyStart = phase === "setup" && tab === "play";

  useEffect(() => {
    if ((phase !== "playing" && phase !== "results") || startedAt === null) return;
    const tick = () => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    if (phase === "results") return;
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [phase, startedAt]);

  const loadHistory = useCallback(async (forceRefresh = false, page = historyPage) => {
    if (!userId) return;
    const cached = getCachedWordSearchSessions(userId, page, 10);
    if (cached && !forceRefresh) {
      setHistory(cached.rows);
      setHistoryTotal(cached.total);
      setHistoryError("");
      setHistoryLoading(false);
      return;
    }

    setHistoryLoading(!cached);
    setHistoryError("");
    try {
      const result = await getWordSearchSessions({ page, pageSize: 10, forceRefresh });
      setHistory(result.rows);
      setHistoryTotal(result.total);
    } catch {
      setHistoryError("Could not load game history. Please try again.");
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPage, userId]);

  useEffect(() => {
    if (!userId || phase !== "results" || startedAt === null || !puzzle || saveStartedRef.current === startedAt) return;
    saveStartedRef.current = startedAt;
    const completedAt = Date.now();
    const durationSeconds = Math.max(0, Math.floor((completedAt - startedAt) / 1000));
    setElapsedSeconds(durationSeconds);
    setSaveState("saving");
    setSaveError("");

    void saveWordSearchSession({
      gridSize,
      difficulty,
      category,
      words: puzzle.words.map(({ word }) => word),
      durationSeconds,
      startedAt: new Date(startedAt).toISOString(),
      completedAt: new Date(completedAt).toISOString(),
    }).then(() => {
      setSaveState("saved");
    }).catch((error: unknown) => {
      saveStartedRef.current = null;
      setSaveState("error");
      setSaveError(error instanceof Error ? error.message : "Could not save this game attempt.");
    });
  }, [category, difficulty, gridSize, phase, puzzle, saveRetryCount, startedAt, userId]);

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
    setElapsedSeconds(0);
    saveStartedRef.current = null;
    setStartedAt(currentTimestamp());
    setGameError("");
    setSaveState("idle");
    setSaveError("");
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

  const {
    selectedCells,
    clearSelection,
    handlePointerDown: handleGridPointerDown,
    handlePointerMove: handleGridPointerMove,
    handlePointerUp: handleGridPointerUp,
    handlePointerCancel: handleGridPointerCancel,
  } = useWordSearchSelection({ enabled: phase === "playing", onSelectionComplete: finishCellSelection });

  if (!isLoaded) return <p className="py-16 text-sm text-slate-500">Loading vocabulary…</p>;

  if (phase === "setup") {
    return (
      <div className={`word-search-setup-page ${showStickyStart ? "pb-24 sm:pb-0" : ""}`}>
        <Link href="/games" className="word-search-back-link mb-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"><ArrowLeft size={16} /> Back to Games</Link>
        <header className="word-search-setup-hero mb-6">
          <p className="text-sm font-bold text-blue-600">Vocabulary game</p>
          <h1 className="page-title mt-1 flex items-center gap-2">Word Search <Star className="size-6 fill-amber-400 text-amber-400" /></h1>
          <p className="page-intro-description mt-2">Find every vocabulary word in the letter grid as quickly as you can.</p>
        </header>

        <div className="word-search-setup-tabs mb-5 flex gap-2 border-b border-slate-200">
          <button type="button" onClick={() => { setTab("play"); setSelectedHistory(null); }} className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm font-medium ${tab === "play" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}><Gamepad2 size={16} /> Play</button>
          {userId && <button type="button" onClick={() => { setTab("history"); setSelectedHistory(null); void loadHistory(); }} className={`inline-flex min-h-11 items-center gap-2 border-b-2 border-transparent px-3 text-sm font-medium text-slate-500 hover:text-slate-800 ${tab === "history" ? "!border-blue-600 !text-blue-700" : ""}`}><History size={16} /> History</button>}
        </div>

        {tab === "history" ? (
          <div className="word-search-history-page">
            {selectedHistory ? (
              <WordSearchHistoryDetail
                session={selectedHistory}
                vocabularyByWord={vocabularyByWord}
                onBack={() => setSelectedHistory(null)}
                onPlayAgain={() => { setSelectedHistory(null); setTab("play"); }}
              />
            ) : (
              <Card className="word-search-history-dashboard overflow-hidden p-0">
                <WordSearchHistoryList
                  history={history}
                  historyTotal={historyTotal}
                  historyPage={historyPage}
                  historyLoading={historyLoading}
                  historyError={historyError}
                  fastestSeconds={fastestHistorySeconds}
                  averageWordsPerRound={averageWordsPerRound}
                  onRefresh={() => void loadHistory(true)}
                  onPlay={() => setTab("play")}
                  onSelect={setSelectedHistory}
                  onPageChange={(page) => { setHistoryPage(page); void loadHistory(false, page); }}
                />
              </Card>
            )}
          </div>
        ) : (
        <WordSearchSetupForm
          gridSize={gridSize}
          difficulty={difficulty}
          category={category}
          categoriesExpanded={categoriesExpanded}
          categoryOptions={categoryOptions}
          targetCount={targetCount}
          gameError={gameError}
          onGridSizeChange={setGridSize}
          onDifficultyChange={setDifficulty}
          onCategoryChange={setCategory}
          onCategoriesExpandedChange={() => setCategoriesExpanded((expanded) => !expanded)}
          onStart={handleStartGame}
          preview={<BoardPreview gridSize={gridSize} difficulty={difficulty} wordCount={targetCount} />}
        />
        )}
        {showStickyStart && (
          <div className="word-search-sticky-start fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur sm:hidden">
            <Button onClick={handleStartGame} disabled={targetCount === 0} className="min-h-12 w-full"><Gamepad2 size={17} /> Start game</Button>
          </div>
        )}
      </div>
    );
  }

  if (!puzzle) return null;

  const foundCells = new Set(Object.values(foundWordPaths).flatMap((path) => path.map(({ row, column }) => `${row}:${column}`)));
  return (
    <div className={phase === "playing" ? "word-search-playing" : "pb-8"}>
      {phase === "playing" ? (
        <div className="sticky top-25 z-20 -mx-2 mb-4 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-2 py-2.5 backdrop-blur lg:top-0 lg:mx-0 lg:bg-slate-50/95">
          <button type="button" onClick={backToSetup} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"><ArrowLeft size={16} /> Back to Setup</button>
          <div className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"><Clock3 size={16} />{formatDuration(elapsedSeconds)}</div>
        </div>
      ) : (
        <Link href="/games" className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"><ArrowLeft size={16} /> Back to Games</Link>
      )}
      <header className="word-search-game-heading mb-3 md:mb-5 flex flex-wrap items-end justify-between gap-3">

          <p className="text-sm font-medium text-blue-600">Word Search · {difficulty}</p>
          <h1 className="page-title mt-1">Find the words</h1>

      </header>

      {phase === "results" ? (
        <WordSearchResults
          wordCount={puzzle.words.length}
          duration={formatDuration(elapsedSeconds)}
          saveState={saveState}
          saveError={saveError}
          onRetrySave={() => {
            saveStartedRef.current = null;
            setSaveRetryCount((count) => count + 1);
          }}
          onPlayAgain={handleStartGame}
          onViewHistory={() => {
            setPhase("setup");
            setTab("history");
            setHistoryPage(1);
            setSelectedHistory(null);
            void loadHistory(true, 1);
          }}
        />
      ) : (
        <div className="word-search-game-layout grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_250px]">
          <Card className="word-search-board-card order-2 min-w-0 p-3 sm:p-5 lg:order-1">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1 text-sm text-slate-500"><span>{foundIds.size} / {puzzle.words.length} found</span><button type="button" onClick={clearSelection} disabled={selectedCells.length === 0} className="text-blue-600 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-40">Clear selection</button></div>
            <div className="min-w-0 overflow-hidden md:pb-2" aria-label={`${gridSize} by ${gridSize} letter grid`}>
              <div onPointerDown={handleGridPointerDown} onPointerMove={handleGridPointerMove} onPointerUp={handleGridPointerUp} onPointerCancel={handleGridPointerCancel} className={`word-search-grid word-search-game-grid word-search-grid--${gridSize} mx-auto grid ${gridSize === 10 ? "gap-[2px]" : "gap-px"} touch-none select-none`}>
                {puzzle.letters.flatMap((row, rowIndex) => row.map((letter, columnIndex) => {
                  const selected = selectedCells.some((cell) => cell.row === rowIndex && cell.column === columnIndex);
                  const found = foundCells.has(`${rowIndex}:${columnIndex}`);
                  return <button key={`${rowIndex}-${columnIndex}`} type="button" data-cell-row={rowIndex} data-cell-column={columnIndex} aria-label={`Row ${rowIndex + 1}, column ${columnIndex + 1}, ${letter}`} aria-pressed={selected || found} className={`grid aspect-square min-h-0 min-w-0 w-full place-items-center rounded-[5px] p-0 font-semibold leading-none transition ${gridSize === 20 ? "text-[8px] lg:text-base" : gridSize === 15 ? "text-[10px] lg:text-xl" : "text-sm lg:text-[28px]"} ${found ? "bg-emerald-100 text-emerald-800" : selected ? "bg-blue-600 text-white ring-2 ring-blue-200" : "bg-slate-50 text-slate-700 hover:bg-blue-50"}`}>{letter}</button>;
                }))}
              </div>
            </div>
            <p aria-live="polite" className="mt-2 px-1 text-xs text-slate-500 hidden md:block">{selectedCells.length > 0 ? `${selectedCells.length} letter${selectedCells.length === 1 ? "" : "s"} selected. Release to check the word.` : "Click and drag from the first letter to the last, then release. Words run left-to-right, top-to-bottom, or diagonally."}</p>
          </Card>

          <Card className="word-search-words-card order-1 p-5 lg:order-2">
            <h2 className="font-semibold text-slate-950">Words to find</h2>
            <p className="mt-1 text-xs text-slate-500 hidden md:block">Find them in any order.</p>
            <WordSearchWordList words={puzzle.words} vocabularyById={vocabularyById} foundIds={foundIds} />
          </Card>
        </div>
      )}
    </div>
  );
}
