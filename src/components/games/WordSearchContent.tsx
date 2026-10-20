"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Clock3, Gamepad2, History, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CategoryDropdown } from "@/components/vocabulary/VocabularyToolbar";
import { useVocabulary } from "@/contexts/VocabularyContext";
import type { VocabularyWord } from "@/data/vocabulary";
import type { WordSearchSessionRow } from "@/types/database";
import { createWordSearchPuzzle, findWordSearchSelectionPrefix, normalizeWordSearchWord } from "@/lib/word-search.mjs";
import { getCachedWordSearchSessions, getWordSearchSessions, saveWordSearchSession } from "@/lib/supabase/word-search-history";

type GridSize = 10 | 20 | 30;
type Difficulty = "easy" | "medium" | "hard";
type Phase = "setup" | "playing" | "results";
type Tab = "play" | "history";
type CellPosition = { row: number; column: number };

const GRID_SIZES: GridSize[] = [10, 20, 30];
const DIFFICULTIES: { value: Difficulty; label: string; description: string }[] = [
  { value: "easy", label: "Easy", description: "Shorter words and fewer targets." },
  { value: "medium", label: "Medium", description: "A mix of short and longer words." },
  { value: "hard", label: "Hard", description: "Longer words and a denser target list." },
];

const WORD_TARGETS: Record<GridSize, Record<Difficulty, number>> = {
  10: { easy: 5, medium: 7, hard: 9 },
  20: { easy: 12, medium: 17, hard: 22 },
  30: { easy: 20, medium: 28, hard: 36 },
};

const MIN_WORD_LENGTH: Record<Difficulty, number> = { easy: 2, medium: 4, hard: 6 };

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function formatHistoryDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
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

export function WordSearchContent({ userId }: { userId: string }) {
  const { words, categories, isLoaded } = useVocabulary();
  const [gridSize, setGridSize] = useState<GridSize>(10);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [category, setCategory] = useState("all");
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

  const candidates = useMemo(() => selectableWords(words, category, difficulty, gridSize), [words, category, difficulty, gridSize]);
  const targetCount = Math.min(WORD_TARGETS[gridSize][difficulty], candidates.length);

  useEffect(() => {
    if ((phase !== "playing" && phase !== "results") || startedAt === null) return;
    const tick = () => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    if (phase === "results") return;
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [phase, startedAt]);

  const loadHistory = useCallback(async (forceRefresh = false, page = historyPage) => {
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
    if (phase !== "results" || startedAt === null || !puzzle || saveStartedRef.current === startedAt) return;
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
  }, [category, difficulty, gridSize, phase, puzzle, saveRetryCount, startedAt]);

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

  function handleCellSelection(position: CellPosition) {
    if (!puzzle || phase !== "playing") return;
    const selection = [...selectedCells, position];
    const match = findWordSearchSelectionPrefix(puzzle, selection, foundIds);
    if (!match) {
      setSelectedCells([position]);
      return;
    }

    setSelectedCells(selection);
    if (!match.complete) {
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

  if (!isLoaded) return <p className="py-16 text-sm text-slate-500">Loading vocabulary…</p>;

  if (phase === "setup") {
    return (
      <div>
        <Link href="/games" className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"><ArrowLeft size={16} /> Back to Games</Link>
        <header className="mb-6">
          <p className="text-sm font-medium text-blue-600">Vocabulary game</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Word Search</h1>
          <p className="mt-2 text-sm text-slate-500">Find every vocabulary word in the letter grid as quickly as you can.</p>
        </header>

        <div className="mb-5 flex gap-2 border-b border-slate-200">
          <button type="button" onClick={() => { setTab("play"); setSelectedHistory(null); }} className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm font-medium ${tab === "play" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}><Gamepad2 size={16} /> Play</button>
          <button type="button" onClick={() => { setTab("history"); setSelectedHistory(null); void loadHistory(); }} className={`inline-flex min-h-11 items-center gap-2 border-b-2 px-3 text-sm font-medium ${tab === "history" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}><History size={16} /> History</button>
        </div>

        {tab === "history" ? (
          <Card className="max-w-3xl p-5 sm:p-8">
            {selectedHistory ? (
              <>
                <button type="button" onClick={() => setSelectedHistory(null)} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"><ArrowLeft size={16} /> All game attempts</button>
                <h2 className="text-xl font-semibold text-slate-950">Word Search review</h2>
                <p className="mt-1 text-sm text-slate-500">{new Date(selectedHistory.completed_at).toLocaleString()} · {selectedHistory.grid_size} × {selectedHistory.grid_size} · {selectedHistory.difficulty} · {selectedHistory.category === "all" ? "All categories" : selectedHistory.category} · {formatHistoryDuration(selectedHistory.duration_seconds)}</p>
                <h3 className="mt-6 text-sm font-semibold text-slate-700">Words found</h3>
                <ul className="mt-3 flex flex-wrap gap-2">{selectedHistory.words.map((word) => <li key={word} className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{word}</li>)}</ul>
              </>
            ) : (
              <>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold text-slate-950">Your Word Search history</h2><p className="mt-1 text-sm text-slate-500">Review completed boards, settings, and solve times.</p></div><Button variant="secondary" onClick={() => void loadHistory(true)} disabled={historyLoading}><RotateCcw size={15} /> Refresh</Button></div>
                {historyError && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{historyError}</p>}
                {historyLoading ? <p className="py-10 text-center text-sm text-slate-500">Loading game history…</p> : history.length === 0 ? <p className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">No completed games yet. Your finished rounds will appear here.</p> : (
                  <div className="space-y-3">{history.map((session) => <button key={session.id} type="button" onClick={() => setSelectedHistory(session)} className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50/40"><span><span className="block font-semibold text-slate-900">{session.word_count} words · {session.grid_size} × {session.grid_size} · {session.difficulty}</span><span className="mt-1 block text-xs text-slate-500">{new Date(session.completed_at).toLocaleString()} · {session.category === "all" ? "All categories" : session.category}</span></span><span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600"><Clock3 size={15} /> {formatHistoryDuration(session.duration_seconds)} <span aria-hidden="true" className="ml-2 text-slate-400">›</span></span></button>)}</div>
                )}
                {!historyLoading && !historyError && historyTotal > 0 && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500"><span>Page {historyPage} of {Math.max(1, Math.ceil(historyTotal / 10))}</span><div className="flex gap-2"><Button variant="secondary" aria-label="Previous history page" disabled={historyPage <= 1} onClick={() => { const nextPage = historyPage - 1; setHistoryPage(nextPage); void loadHistory(false, nextPage); }}><ChevronLeft size={16} /></Button><Button variant="secondary" aria-label="Next history page" disabled={historyPage >= Math.ceil(historyTotal / 10)} onClick={() => { const nextPage = historyPage + 1; setHistoryPage(nextPage); void loadHistory(false, nextPage); }}><ChevronRight size={16} /></Button></div></div>}
              </>
            )}
          </Card>
        ) : (
        <Card className="max-w-3xl p-5 sm:p-8">
          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-slate-700">Grid size</legend>
            <div className="grid grid-cols-3 gap-2">
              {GRID_SIZES.map((size) => <ChoiceButton key={size} active={gridSize === size} onClick={() => setGridSize(size)}>{size} × {size}</ChoiceButton>)}
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className="mb-3 text-sm font-semibold text-slate-700">Difficulty</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {DIFFICULTIES.map((option) => <button key={option.value} type="button" aria-pressed={difficulty === option.value} onClick={() => setDifficulty(option.value)} className={`rounded-xl border p-3 text-left transition ${difficulty === option.value ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100" : "border-slate-200 hover:border-blue-200"}`}><span className="block text-sm font-semibold text-slate-900">{option.label}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{option.description}</span></button>)}
            </div>
          </fieldset>

          <fieldset className="mt-6">
            <legend className="mb-3 text-sm font-semibold text-slate-700">Category</legend>
            <div className="w-full sm:max-w-sm"><CategoryDropdown category={category} categories={categories} onChange={setCategory} includeAll allLabel="All categories" fullWidth /></div>
            <p className="mt-2 text-xs text-slate-500">All categories gives you a larger word pool. This round will contain up to {WORD_TARGETS[gridSize][difficulty]} words, chosen automatically.</p>
          </fieldset>

          {targetCount < WORD_TARGETS[gridSize][difficulty] && targetCount > 0 && <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Only {targetCount} words match this category and difficulty. The round will use the available words.</p>}
          {targetCount === 0 && <p role="status" className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">No words fit this difficulty and category. Try All categories or an easier level.</p>}
          {gameError && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{gameError}</p>}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">Words can appear left-to-right, top-to-bottom, or diagonally downward.</p>
            <Button onClick={startGame} disabled={targetCount === 0} className="min-h-12 w-full sm:w-auto">Start game</Button>
          </div>
        </Card>
        )}
      </div>
    );
  }

  if (!puzzle) return null;

  const foundCells = new Set(Object.values(foundWordPaths).flatMap((path) => path.map(({ row, column }) => `${row}:${column}`)));
  const cellSize = gridSize === 10 ? 36 : gridSize === 20 ? 27 : 23;

  return (
    <div className="pb-8">
      <Link href="/games" className="mb-5 inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"><ArrowLeft size={16} /> Back to Games</Link>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-sm font-medium text-blue-600">Word Search · {difficulty}</p><h1 className="mt-1 text-2xl font-bold text-slate-950">Find the words</h1></div>
        <div className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm"><Clock3 size={16} />{formatDuration(elapsedSeconds)}</div>
      </header>

      {phase === "results" ? (
        <Card className="max-w-3xl p-6 text-center sm:p-10">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><Check size={27} /></span>
          <h2 className="mt-4 text-2xl font-bold text-slate-950">All words found!</h2>
          <p className="mt-2 text-slate-500">You found {puzzle.words.length} words in {formatDuration(elapsedSeconds)}.</p>
          {saveState === "saving" && <p role="status" className="mt-3 text-sm text-slate-500">Saving your game history…</p>}
          {saveState === "saved" && <p role="status" className="mt-3 text-sm text-emerald-700">Game saved to your history.</p>}
          {saveState === "error" && <div className="mt-3"><p role="alert" className="text-sm text-red-600">{saveError}</p><Button variant="secondary" className="mt-2" onClick={() => { saveStartedRef.current = null; setSaveRetryCount((count) => count + 1); }}>Retry save</Button></div>}
          <div className="mt-6 flex flex-wrap justify-center gap-3"><Button onClick={startGame}><RotateCcw size={16} /> Play again</Button>{saveState === "saved" && <Button variant="secondary" onClick={() => { setPhase("setup"); setTab("history"); setHistoryPage(1); setSelectedHistory(null); void loadHistory(true, 1); }}><History size={16} /> View history</Button>}</div>
        </Card>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_250px]">
          <Card className="min-w-0 p-3 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1 text-sm text-slate-500"><span>{foundIds.size} / {puzzle.words.length} found</span><button type="button" onClick={() => setSelectedCells([])} disabled={selectedCells.length === 0} className="text-blue-600 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-40">Clear selection</button></div>
            <div className="overflow-x-auto overscroll-x-contain pb-2" aria-label={`${gridSize} by ${gridSize} letter grid`}>
              <div className={`mx-auto grid w-max gap-[2px] touch-manipulation select-none ${gridSize === 30 ? "lg:[--word-search-cell-size:46px]" : gridSize === 20 ? "lg:[--word-search-cell-size:54px]" : "lg:[--word-search-cell-size:72px]"}`} style={{ gridTemplateColumns: `repeat(${gridSize}, var(--word-search-cell-size))`, "--word-search-cell-size": `${cellSize}px` } as CSSProperties}>
                {puzzle.letters.flatMap((row, rowIndex) => row.map((letter, columnIndex) => {
                  const selected = selectedCells.some((cell) => cell.row === rowIndex && cell.column === columnIndex);
                  const found = foundCells.has(`${rowIndex}:${columnIndex}`);
                  return <button key={`${rowIndex}-${columnIndex}`} type="button" aria-label={`Row ${rowIndex + 1}, column ${columnIndex + 1}, ${letter}`} aria-pressed={selected || found} onClick={() => handleCellSelection({ row: rowIndex, column: columnIndex })} className={`grid aspect-square place-items-center rounded-[5px] font-semibold transition ${gridSize === 30 ? "text-[10px] lg:text-[20px]" : gridSize === 20 ? "text-xs lg:text-2xl" : "text-sm lg:text-[28px]"} ${found ? "bg-emerald-100 text-emerald-800" : selected ? "bg-blue-600 text-white ring-2 ring-blue-200" : "bg-slate-50 text-slate-700 hover:bg-blue-50"}`}>{letter}</button>;
                }))}
              </div>
            </div>
            <p aria-live="polite" className="mt-2 px-1 text-xs text-slate-500">{selectedCells.length > 0 ? `${selectedCells.length} letter${selectedCells.length === 1 ? "" : "s"} selected. Tap the next letter in order.` : "Tap each letter in order. Words run left-to-right, top-to-bottom, or diagonally."}</p>
          </Card>

          <Card className="p-5">
            <h2 className="font-semibold text-slate-950">Words to find</h2>
            <p className="mt-1 text-xs text-slate-500">Find them in any order.</p>
            <ul className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-1">
              {puzzle.words.map((word) => <li key={word.id} className={`rounded-lg px-3 py-2 text-sm ${foundIds.has(word.id) ? "bg-emerald-50 text-emerald-700 line-through" : "bg-slate-50 text-slate-700"}`}>{word.word}</li>)}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}

function ChoiceButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={`min-h-12 cursor-pointer rounded-xl border px-4 py-3 text-sm font-semibold transition ${active ? "border-blue-500 bg-blue-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50"}`}>{children}</button>;
}
