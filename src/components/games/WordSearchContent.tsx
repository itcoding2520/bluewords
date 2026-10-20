"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Clock3, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CategoryDropdown } from "@/components/vocabulary/VocabularyToolbar";
import { useVocabulary } from "@/contexts/VocabularyContext";
import type { VocabularyWord } from "@/data/vocabulary";
import { createWordSearchPuzzle, findWordSearchSelection, normalizeWordSearchWord } from "@/lib/word-search.mjs";

type GridSize = 10 | 20 | 30;
type Difficulty = "easy" | "medium" | "hard";
type Phase = "setup" | "playing" | "results";
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

function selectableWords(words: VocabularyWord[], category: string, difficulty: Difficulty, size: GridSize) {
  const seen = new Set<string>();
  return words.flatMap((word) => {
    const normalized = normalizeWordSearchWord(word.word);
    if ((category !== "all" && word.category !== category) || normalized.length < MIN_WORD_LENGTH[difficulty] || normalized.length > size || seen.has(normalized)) return [];
    seen.add(normalized);
    return [{ id: word.id, word: word.word }];
  });
}

export function WordSearchContent() {
  const { words, categories, isLoaded } = useVocabulary();
  const [gridSize, setGridSize] = useState<GridSize>(10);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [category, setCategory] = useState("all");
  const [phase, setPhase] = useState<Phase>("setup");
  const [puzzle, setPuzzle] = useState<ReturnType<typeof createWordSearchPuzzle> | null>(null);
  const [foundIds, setFoundIds] = useState<Set<string>>(() => new Set());
  const [selectedStart, setSelectedStart] = useState<CellPosition | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [gameError, setGameError] = useState("");

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

  function startGame() {
    const nextPuzzle = createWordSearchPuzzle(candidates, gridSize, targetCount);
    if (nextPuzzle.words.length === 0) {
      setGameError("We couldn't build a board from this selection. Try a different category or difficulty.");
      return;
    }
    setPuzzle(nextPuzzle);
    setFoundIds(new Set());
    setSelectedStart(null);
    setElapsedSeconds(0);
    setStartedAt(Date.now());
    setGameError("");
    setPhase("playing");
  }

  function handleCellSelection(position: CellPosition) {
    if (!puzzle || phase !== "playing") return;
    if (!selectedStart) {
      setSelectedStart(position);
      return;
    }

    const foundWord = findWordSearchSelection(puzzle, selectedStart, position);
    if (!foundWord) {
      setSelectedStart(position);
      return;
    }

    if (foundIds.has(foundWord.id)) {
      setSelectedStart(null);
      return;
    }

    const nextFoundIds = new Set(foundIds);
    nextFoundIds.add(foundWord.id);
    setFoundIds(nextFoundIds);
    setSelectedStart(null);

    if (nextFoundIds.size === puzzle.words.length) {
      setPhase("results");
    }
  }

  if (!isLoaded) return <p className="py-16 text-sm text-slate-500">Loading vocabulary…</p>;

  if (phase === "setup") {
    return (
      <div>
        <Link href="/games" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"><ArrowLeft size={16} /> All games</Link>
        <header className="mb-6">
          <p className="text-sm font-medium text-blue-600">Vocabulary game</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Word Search</h1>
          <p className="mt-2 text-sm text-slate-500">Find every vocabulary word in the letter grid as quickly as you can.</p>
        </header>

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
      </div>
    );
  }

  if (!puzzle) return null;

  const foundCells = new Set(puzzle.words.filter((word) => foundIds.has(word.id)).flatMap((word) => word.cells.map(({ row, column }) => `${row}:${column}`)));
  const cellSize = gridSize === 10 ? 36 : gridSize === 20 ? 27 : 23;

  return (
    <div className="pb-8">
      <Link href="/games" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"><ArrowLeft size={16} /> All games</Link>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-sm font-medium text-blue-600">Word Search · {difficulty}</p><h1 className="mt-1 text-2xl font-bold text-slate-950">Find the words</h1></div>
        <div className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm"><Clock3 size={16} />{formatDuration(elapsedSeconds)}</div>
      </header>

      {phase === "results" ? (
        <Card className="max-w-3xl p-6 text-center sm:p-10">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><Check size={27} /></span>
          <h2 className="mt-4 text-2xl font-bold text-slate-950">All words found!</h2>
          <p className="mt-2 text-slate-500">You found {puzzle.words.length} words in {formatDuration(elapsedSeconds)}.</p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row"><Button onClick={startGame}><RotateCcw size={16} /> Play again</Button><Link href="/games" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Choose another game</Link></div>
        </Card>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_250px]">
          <Card className="min-w-0 p-3 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1 text-sm text-slate-500"><span>{foundIds.size} / {puzzle.words.length} found</span><button type="button" onClick={() => setSelectedStart(null)} className="text-blue-600 hover:text-blue-800">Clear selection</button></div>
            <div className="overflow-x-auto overscroll-x-contain pb-2" aria-label={`${gridSize} by ${gridSize} letter grid`}>
              <div className="mx-auto grid w-max gap-[2px] touch-manipulation select-none" style={{ gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)` }}>
                {puzzle.letters.flatMap((row, rowIndex) => row.map((letter, columnIndex) => {
                  const selected = selectedStart?.row === rowIndex && selectedStart.column === columnIndex;
                  const found = foundCells.has(`${rowIndex}:${columnIndex}`);
                  return <button key={`${rowIndex}-${columnIndex}`} type="button" aria-label={`Row ${rowIndex + 1}, column ${columnIndex + 1}, ${letter}`} aria-pressed={selected || found} onClick={() => handleCellSelection({ row: rowIndex, column: columnIndex })} className={`grid aspect-square place-items-center rounded-[5px] font-semibold transition ${gridSize === 30 ? "text-[10px]" : gridSize === 20 ? "text-xs" : "text-sm"} ${found ? "bg-emerald-100 text-emerald-800" : selected ? "bg-blue-600 text-white ring-2 ring-blue-200" : "bg-slate-50 text-slate-700 hover:bg-blue-50"}`}>{letter}</button>;
                }))}
              </div>
            </div>
            <p aria-live="polite" className="mt-2 px-1 text-xs text-slate-500">{selectedStart ? "Now select the last letter of the word." : "Select a word’s first letter, then its last letter."}</p>
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
