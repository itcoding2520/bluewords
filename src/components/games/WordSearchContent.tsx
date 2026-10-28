"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Award, BarChart3, BookOpen, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock3, Gamepad2, Grid3X3, History, Info, Play, RotateCcw, Star, Tag, Trophy } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { useVocabulary } from "@/contexts/VocabularyContext";
import type { VocabularyWord } from "@/data/vocabulary";
import type { WordSearchSessionRow } from "@/types/database";
import type { VocabularyCategoryColor } from "@/lib/supabase/categories";
import { useVocabularyImageUrl } from "@/hooks/useVocabularyImageUrl";
import { PronunciationButton } from "@/components/vocabulary/PronunciationButton";
import { getCategoryImageUrl } from "@/lib/supabase/category-images";
import { createWordSearchPuzzle, findWordSearchSelectionPrefix, getWordSearchSelectionPath, normalizeWordSearchWord } from "@/lib/word-search.mjs";
import { getCachedWordSearchSessions, getWordSearchSessions, saveWordSearchSession } from "@/lib/supabase/word-search-history";

type GridSize = 10 | 15 | 20;
type Difficulty = "easy" | "medium" | "hard";
type Phase = "setup" | "playing" | "results";
type Tab = "play" | "history";
type CellPosition = { row: number; column: number };
type ActiveDrag = { pointerId: number; start: CellPosition };

function getCellPosition(element: Element | null): CellPosition | null {
  const cell = element?.closest<HTMLElement>("[data-cell-row][data-cell-column]");
  if (!cell) return null;
  const row = Number(cell.dataset.cellRow);
  const column = Number(cell.dataset.cellColumn);
  return Number.isInteger(row) && Number.isInteger(column) ? { row, column } : null;
}

const GRID_SIZES: GridSize[] = [10, 15, 20];
const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const CATEGORY_DOT_STYLES: Record<VocabularyCategoryColor, string> = {
  blue: "bg-blue-500",
  violet: "bg-violet-500",
  orange: "bg-orange-500",
  green: "bg-emerald-500",
  rose: "bg-rose-500",
  indigo: "bg-indigo-500",
  teal: "bg-teal-500",
  amber: "bg-amber-500",
  pink: "bg-pink-500",
  slate: "bg-slate-500",
};

const WORD_TARGETS: Record<GridSize, Record<Difficulty, number>> = {
  10: { easy: 5, medium: 7, hard: 9 },
  15: { easy: 8, medium: 12, hard: 16 },
  20: { easy: 12, medium: 17, hard: 22 },
};

const MIN_WORD_LENGTH: Record<Difficulty, number> = { easy: 2, medium: 4, hard: 6 };
const PREVIEW_LETTERS = [
  ["W", "S", "E", "A", "R", "C", "H", "O"],
  ["L", "E", "A", "R", "N", "I", "N", "G"],
  ["T", "I", "M", "E", "F", "U", "N", "D"],
  ["P", "L", "A", "Y", "E", "R", "S", "X"],
  ["Q", "M", "K", "T", "V", "O", "C", "A"],
  ["B", "B", "L", "U", "E", "W", "O", "R"],
  ["D", "S", "G", "A", "M", "E", "C", "H"],
  ["I", "P", "S", "F", "O", "C", "U", "S"],
];

function CategoryChip({
  name,
  imagePath,
  dotClassName,
  selected,
  onClick,
}: {
  name: string;
  imagePath: string | null;
  dotClassName: string;
  selected: boolean;
  onClick: () => void;
}) {
  const isCategoryImage = imagePath?.startsWith("category:") ?? false;
  const wordImageUrl = useVocabularyImageUrl(isCategoryImage ? null : imagePath);
  const imageUrl = isCategoryImage ? getCategoryImageUrl(imagePath?.slice("category:".length)) : wordImageUrl;

  return (
    <button type="button" aria-pressed={selected} onClick={onClick} title={name} className={`flex h-10 min-w-0 items-center gap-1.5 rounded-full border px-2 text-left text-xs transition sm:gap-2 sm:px-2.5 ${selected ? "border-indigo-200 bg-indigo-50 font-semibold text-indigo-700" : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50"}`}>
      {name === "All categories" ? <Grid3X3 size={21} className="shrink-0 text-violet-600" aria-hidden="true" /> : imageUrl ? <Image src={imageUrl} alt="" width={24} height={24} unoptimized className="size-6 shrink-0 rounded-full object-cover" /> : <span className={`size-2 shrink-0 rounded-full ${dotClassName}`} aria-hidden="true" />}
      <span className="min-w-0 truncate">{name}</span>
    </button>
  );
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

function HistoryWordCard({ word, meaning }: { word: VocabularyWord | undefined; meaning: string }) {
  const imageUrlFromPath = useVocabularyImageUrl(word?.imagePath);
  const imageUrl = word?.imageUrl ?? imageUrlFromPath;

  return (
    <li className="word-search-history-word-card">
      {imageUrl ? <Image src={imageUrl} alt={`Illustration for ${word?.word ?? "vocabulary word"}`} width={56} height={56} unoptimized className="word-search-history-word-image" /> : <span className="word-search-history-word-placeholder" aria-hidden="true">{word?.word.slice(0, 1).toUpperCase() ?? "?"}</span>}
      <span className="min-w-0 flex-1"><span className="flex items-center gap-1"><span className="truncate font-extrabold text-indigo-950">{word?.word ?? "Word no longer in your vocabulary"}</span>{word && <PronunciationButton word={word.word} />}</span><span className="mt-1 block truncate text-xs text-slate-500">{meaning}</span></span>
      <span className="word-search-history-word-check" aria-label="Found"><Check size={14} /></span>
    </li>
  );
}

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}


function selectableWords(words: VocabularyWord[], category: string, difficulty: Difficulty, size: GridSize) {
  const seen = new Set<string>();
  return words.flatMap((word) => {
    const normalized = normalizeWordSearchWord(word.word);
    if ((category !== "all" && word.category !== category) || normalized.length < MIN_WORD_LENGTH[difficulty] || normalized.length > size || seen.has(normalized)) return [];
    seen.add(normalized);
    return [{ id: word.id, word: word.word }];
  });
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
  const [selectedCells, setSelectedCells] = useState<CellPosition[]>([]);
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
  const activeDragRef = useRef<ActiveDrag | null>(null);

  const candidates = useMemo(() => selectableWords(words, category, difficulty, gridSize), [words, category, difficulty, gridSize]);
  const vocabularyById = useMemo(() => new Map(words.map((word) => [word.id, word] as const)), [words]);
  const vocabularyByWord = useMemo(() => new Map(words.map((word) => [normalizeWordSearchWord(word.word), word] as const)), [words]);
  const categoryOptions = useMemo(() => {
    const visibleCategories = categories.filter((item) => item.name.trim().toLowerCase() !== "uncategorized");
    return [
      { id: "all-categories", name: "All categories", value: "all", color: "blue" as VocabularyCategoryColor, imagePath: null },
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
  const fastestHistory = history.reduce<WordSearchSessionRow | null>((best, item) => !best || item.duration_seconds < best.duration_seconds ? item : best, null);
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

  function startGame() {
    const nextPuzzle = createWordSearchPuzzle(candidates, gridSize, targetCount);
    if (nextPuzzle.words.length === 0) {
      setGameError("We couldn't build a board from this selection. Try a different category or difficulty.");
      return;
    }
    setPuzzle(nextPuzzle);
    setFoundIds(new Set());
    setFoundWordPaths({});
    setSelectedCells([]);
    setElapsedSeconds(0);
    saveStartedRef.current = null;
    setStartedAt(Date.now());
    setGameError("");
    setSaveState("idle");
    setSaveError("");
    setPhase("playing");
  }

  function backToSetup() {
    activeDragRef.current = null;
    setSelectedCells([]);
    setStartedAt(null);
    setPhase("setup");
  }

  function finishCellSelection(selection: CellPosition[]) {
    if (!puzzle || phase !== "playing" || selection.length < 2) {
      setSelectedCells([]);
      return;
    }
    const match = findWordSearchSelectionPrefix(puzzle, selection, foundIds);
    if (!match?.complete) {
      setSelectedCells([]);
      return;
    }

    const nextFoundIds = new Set(foundIds);
    nextFoundIds.add(match.word.id);
    setFoundIds(nextFoundIds);
    setFoundWordPaths((paths) => ({ ...paths, [match.word.id]: selection }));
    setSelectedCells([]);

    if (nextFoundIds.size === puzzle.words.length) {
      setPhase("results");
    }
  }

  function handleGridPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (phase !== "playing" || event.button !== 0) return;
    const start = getCellPosition(event.target as Element);
    if (!start) return;
    event.preventDefault();
    activeDragRef.current = { pointerId: event.pointerId, start };
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedCells([start]);
  }

  function handleGridPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = activeDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    const end = getCellPosition(document.elementFromPoint(event.clientX, event.clientY));
    if (!end) return;
    setSelectedCells(getWordSearchSelectionPath(drag.start, end) ?? [drag.start]);
  }

  function handleGridPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const drag = activeDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const end = getCellPosition(document.elementFromPoint(event.clientX, event.clientY));
    const selection = end ? getWordSearchSelectionPath(drag.start, end) : null;
    activeDragRef.current = null;
    finishCellSelection(selection ?? []);
  }

  function handleGridPointerCancel(event: React.PointerEvent<HTMLDivElement>) {
    if (activeDragRef.current?.pointerId !== event.pointerId) return;
    activeDragRef.current = null;
    setSelectedCells([]);
  }

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
              <Card className="word-search-history-detail overflow-hidden p-0">
                <div className="word-search-history-detail-top">
                  <button type="button" onClick={() => setSelectedHistory(null)} className="word-search-history-back inline-flex min-h-10 items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"><ArrowLeft size={16} /> All game attempts</button>
                  <div className="word-search-history-detail-hero">
                    <div className="word-search-history-detail-mascot"><Image src="/images/ui/illustrations/hero-book-mascot.svg" alt="" width={260} height={220} /></div>
                    <div className="word-search-history-detail-summary">
                      <p className="text-xs font-bold uppercase tracking-[.14em] text-blue-600">Round complete</p>
                      <h2 className="mt-2 flex flex-wrap items-center gap-2 text-3xl font-extrabold text-indigo-950 sm:text-5xl"><Trophy className="size-9 fill-amber-400 text-amber-500" /><span className="text-blue-600">{selectedHistory.word_count}</span> words found</h2>
                      <div className="word-search-history-detail-stats">
                        <span className="word-search-history-detail-stat word-search-detail-time"><Clock3 /><span><small>Time</small><strong>{formatDuration(selectedHistory.duration_seconds)}</strong></span></span>
                        <span className="word-search-history-detail-stat word-search-detail-grid"><Grid3X3 /><span><small>Grid size</small><strong>{selectedHistory.grid_size} × {selectedHistory.grid_size}</strong></span></span>
                        <span className="word-search-history-detail-stat word-search-detail-level"><BarChart3 /><span><small>Level</small><strong className="capitalize">{selectedHistory.difficulty}</strong></span></span>
                        <span className="word-search-history-detail-stat word-search-detail-category"><Tag /><span><small>Category</small><strong>{selectedHistory.category === "all" ? "All categories" : selectedHistory.category}</strong></span></span>
                      </div>
                      <p className="word-search-history-detail-date"><CalendarDays size={17} />{new Date(selectedHistory.completed_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
                <section className="word-search-history-words-section" aria-labelledby="word-search-history-words-title">
                  <div className="word-search-history-words-heading"><h3 id="word-search-history-words-title"><BookOpen size={27} />Words from this round</h3><Button onClick={() => { setSelectedHistory(null); setTab("play"); }} className="rounded-full px-5"><Play size={16} fill="currentColor" /> Play again</Button></div>
                  <ul className="word-search-history-word-grid">{selectedHistory.words.map((word) => {
                    const vocabularyWord = vocabularyByWord.get(normalizeWordSearchWord(word));
                    const meaning = vocabularyWord?.meaning?.trim() || vocabularyWord?.detailedMeanings?.find((item) => item.meaning.trim())?.meaning || "Meaning unavailable";
                    return <HistoryWordCard key={word} word={vocabularyWord} meaning={meaning} />;
                  })}</ul>
                </section>
              </Card>
            ) : (
              <Card className="word-search-history-dashboard overflow-hidden p-0">
                <div className="word-search-history-welcome">
                  <div><p className="text-xs font-bold uppercase tracking-[.14em] text-blue-600">Your progress</p><h2 className="mt-1 text-3xl font-extrabold text-indigo-950 sm:text-4xl">Your game <span className="text-blue-600">journey</span><Star className="ml-2 inline size-6 fill-amber-400 text-amber-400" /></h2><p className="mt-2 max-w-lg text-sm leading-6 text-slate-600 sm:text-base">Great job exploring new words! Keep playing to build your vocabulary and beat your best time.</p></div>
                  <Image src="/images/ui/illustrations/review-trophy.svg" alt="" width={250} height={180} className="word-search-history-mascot" />
                </div>

                <div className="word-search-history-stats">
                  <div className="word-search-history-stat word-search-history-stat-games"><span className="word-search-history-stat-icon"><Gamepad2 size={30} /></span><span><span className="block text-sm font-bold text-blue-700">Total games</span><strong>{historyTotal}</strong></span></div>
                  <div className="word-search-history-stat word-search-history-stat-time"><span className="word-search-history-stat-icon"><Clock3 size={30} /></span><span><span className="block text-sm font-bold text-emerald-700">Best time on page</span><strong>{fastestHistory ? formatDuration(fastestHistory.duration_seconds) : "—"}</strong></span></div>
                  <div className="word-search-history-stat word-search-history-stat-words"><span className="word-search-history-stat-icon"><Star size={30} /></span><span><span className="block text-sm font-bold text-violet-700">Avg. words per round</span><strong>{history.length ? averageWordsPerRound : "—"}</strong></span></div>
                </div>

                <section className="word-search-history-list" aria-labelledby="word-search-history-title">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 id="word-search-history-title" className="text-xl font-extrabold text-indigo-950">Your Word Search history</h3><p className="mt-1 text-sm text-slate-500">Grouped by category, fastest time first.</p></div><Button variant="secondary" onClick={() => void loadHistory(true)} disabled={historyLoading} className="rounded-full border-blue-100 bg-white px-5 text-blue-600"><RotateCcw size={15} className={historyLoading ? "animate-spin" : ""} /> Refresh</Button></div>
                  {historyError && <AutoDismissMessage key={historyError} variant="error" className="mb-4">{historyError}</AutoDismissMessage>}
                  {historyLoading ? <p role="status" className="py-10 text-center text-sm text-slate-500">Loading your game history…</p> : history.length === 0 ? <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 px-5 py-10 text-center"><Trophy className="mx-auto size-9 text-blue-400" /><p className="mt-3 font-bold text-indigo-950">Your journey starts here</p><p className="mt-1 text-sm text-slate-500">Finish a Word Search round and it will appear here.</p><Button className="mt-4" onClick={() => setTab("play")}><Gamepad2 size={16} /> Play a round</Button></div> : <div className="space-y-3">{history.map((session, index) => <button key={session.id} type="button" onClick={() => setSelectedHistory(session)} className={`word-search-history-entry word-search-history-entry-${index % 3} group flex w-full flex-wrap items-center gap-4 p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md sm:p-5`}><span className="word-search-history-medal" aria-hidden="true"><Award size={35} /></span><span className="min-w-0 flex-1"><span className="block text-base font-extrabold text-indigo-950 sm:text-lg">{session.word_count} words · {session.grid_size} × {session.grid_size} · {session.difficulty}</span><span className="mt-2 flex flex-wrap gap-1.5"><span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">{session.grid_size} × {session.grid_size}</span><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold capitalize text-emerald-700">{session.difficulty}</span><span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-700">{session.category === "all" ? "All categories" : session.category}</span><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">{session.word_count} words</span></span><span className="mt-2 flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays size={14} />{new Date(session.completed_at).toLocaleString()}</span></span><span className="flex items-center gap-3 text-sm font-bold tabular-nums text-slate-600"><Clock3 size={16} />{formatDuration(session.duration_seconds)}<ArrowRight size={17} className="text-blue-500 transition group-hover:translate-x-1" /></span></button>)}</div>}
                  {!historyLoading && !historyError && historyTotal > 0 && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm text-slate-500"><span>Page {historyPage} of {Math.max(1, Math.ceil(historyTotal / 10))}</span><div className="flex gap-2"><Button variant="secondary" aria-label="Previous history page" disabled={historyPage <= 1} onClick={() => { const nextPage = historyPage - 1; setHistoryPage(nextPage); void loadHistory(false, nextPage); }}><ChevronLeft size={16} /></Button><Button variant="secondary" aria-label="Next history page" disabled={historyPage >= Math.ceil(historyTotal / 10)} onClick={() => { const nextPage = historyPage + 1; setHistoryPage(nextPage); void loadHistory(false, nextPage); }}><ChevronRight size={16} /></Button></div></div>}
                </section>
              </Card>
            )}
          </div>
        ) : (
        <div className="word-search-setup-layout grid items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="word-search-setup-card flex min-w-0 flex-col p-5 sm:p-8">
          <div className="grid gap-5 xl:grid-cols-2">
            <fieldset className="min-w-0">
              <legend className="mb-3 text-sm font-semibold text-slate-700">Grid size</legend>
              <div className="grid grid-cols-3 gap-2">
                {GRID_SIZES.map((size) => <ChoiceButton key={size} active={gridSize === size} onClick={() => setGridSize(size)}>{size} × {size}</ChoiceButton>)}
              </div>
            </fieldset>

            <fieldset className="min-w-0">
              <legend className="mb-3 text-sm font-semibold text-slate-700">Level</legend>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTIES.map((option) => <button key={option.value} type="button" aria-pressed={difficulty === option.value} onClick={() => setDifficulty(option.value)} className={`min-h-12 rounded-xl border px-2 text-center text-sm transition ${difficulty === option.value ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-blue-200"}`}><span className="block truncate font-semibold text-slate-900">{option.label}</span></button>)}
              </div>
            </fieldset>
          </div>

          <fieldset className="word-search-category-fieldset mt-6">
            <legend className="mb-3 flex items-center gap-2 text-lg font-extrabold text-indigo-950"><Image src="/images/ui/icons/vocabulary.svg" alt="" width={24} height={24} /> Category</legend>
            <p className="mb-3 text-xs text-slate-500">Pick one category or use all your words.</p>
            <div id="word-search-categories" className={`grid grid-cols-3 gap-2 overflow-hidden transition-[max-height] duration-200 sm:grid-cols-5 ${categoriesExpanded ? "max-h-[1000px]" : "max-h-[11.5rem] sm:max-h-[5.5rem] lg:max-h-[11.5rem]"}`}>
              {categoryOptions.map((item) => <CategoryChip key={item.id} name={item.name} imagePath={item.imagePath} dotClassName={CATEGORY_DOT_STYLES[item.color]} selected={category === item.value} onClick={() => setCategory(item.value)} />)}
            </div>
            {categoryOptions.length > 8 && <div className={`mt-2 flex justify-center ${categoryOptions.length <= 12 ? "hidden" : ""} ${categoryOptions.length <= 10 ? "sm:hidden" : "sm:flex"} ${categoryOptions.length <= 20 ? "lg:hidden" : "lg:flex"}`}>
              <button type="button" aria-expanded={categoriesExpanded} aria-controls="word-search-categories" onClick={() => setCategoriesExpanded((expanded) => !expanded)} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
                {categoriesExpanded ? "Show less" : "More"}{categoriesExpanded ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
              </button>
            </div>}
          </fieldset>

          {targetCount < WORD_TARGETS[gridSize][difficulty] && targetCount > 0 && <AutoDismissMessage variant="warning" className="mt-5">Only {targetCount} words match this category and difficulty. The round will use the available words.</AutoDismissMessage>}
          {targetCount === 0 && <AutoDismissMessage variant="warning" className="mt-5">No words fit this difficulty and category. Try All categories or an easier level.</AutoDismissMessage>}
          {gameError && <AutoDismissMessage key={gameError} variant="error" className="mt-4">{gameError}</AutoDismissMessage>}

              <div className="mt-auto flex flex-col gap-3 pt-7 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">Words can appear left-to-right, top-to-bottom, or diagonally downward.</p>
                <Button onClick={startGame} disabled={targetCount === 0} className="word-search-start-button hidden min-h-14 w-full sm:inline-flex sm:w-auto" style={{ minWidth: 180 }}><Gamepad2 size={19} /> Start game</Button>
          </div>
        </Card>
        <BoardPreview gridSize={gridSize} difficulty={difficulty} wordCount={targetCount} />
        </div>
        )}
        {showStickyStart && (
          <div className="word-search-sticky-start fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur sm:hidden">
            <Button onClick={startGame} disabled={targetCount === 0} className="min-h-12 w-full"><Gamepad2 size={17} /> Start game</Button>
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
        <Card className="max-w-3xl p-6 text-center sm:p-10">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><Check size={27} /></span>
          <h2 className="mt-4 text-2xl font-bold text-slate-950">All words found!</h2>
          <p className="mt-2 text-slate-500">You found {puzzle.words.length} words in {formatDuration(elapsedSeconds)}.</p>
          {saveState === "saving" && <p role="status" className="mt-3 text-sm text-slate-500">Saving your game history…</p>}
          {saveState === "saved" && <AutoDismissMessage variant="success" className="mx-auto mt-3 w-fit">Game saved to your history.</AutoDismissMessage>}
          {saveState === "error" && <div className="mt-3"><AutoDismissMessage key={saveError} variant="error">{saveError}</AutoDismissMessage><Button variant="secondary" className="mt-2" onClick={() => { saveStartedRef.current = null; setSaveRetryCount((count) => count + 1); }}>Retry save</Button></div>}
          <div className="mt-6 flex flex-wrap justify-center gap-3"><Button onClick={startGame}><RotateCcw size={16} /> Play again</Button>{saveState === "saved" && <Button variant="secondary" onClick={() => { setPhase("setup"); setTab("history"); setHistoryPage(1); setSelectedHistory(null); void loadHistory(true, 1); }}><History size={16} /> View history</Button>}</div>
        </Card>
      ) : (
        <div className="word-search-game-layout grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_250px]">
          <Card className="word-search-board-card order-2 min-w-0 p-3 sm:p-5 lg:order-1">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1 text-sm text-slate-500"><span>{foundIds.size} / {puzzle.words.length} found</span><button type="button" onClick={() => setSelectedCells([])} disabled={selectedCells.length === 0} className="text-blue-600 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-40">Clear selection</button></div>
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
            <ul className="mt-2 md:mt-4 grid grid-cols-2 gap-2 lg:grid-cols-1">
              {puzzle.words.map((word) => {
                const vocabularyWord = vocabularyById.get(word.id);
                const meaning = vocabularyWord?.meaning?.trim() || vocabularyWord?.detailedMeanings?.find((item) => item.meaning.trim())?.meaning || "Meaning unavailable";
                const found = foundIds.has(word.id);
                return <li key={word.id} className={`min-w-0 rounded-lg p-2 md:px-3 leading-4 ${found ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-700"}`}>
                  <span className={`inline break-words text-sm font-semibold ${found ? "line-through" : ""}`}>{word.word}</span>
                  <span className="inline pl-1 break-words text-xs leading-4 text-slate-500">({meaning})</span>
                </li>;
              })}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}

function ChoiceButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={`min-h-12 cursor-pointer rounded-xl border p-3 text-sm font-semibold transition ${active ? "border-blue-500 bg-blue-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50"}`}>{children}</button>;
}
