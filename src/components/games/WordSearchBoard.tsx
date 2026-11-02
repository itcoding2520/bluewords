import { Card } from "@/components/ui/Card";
import type { CellPosition } from "@/hooks/useWordSearchSelection";
import type { GridSize } from "@/lib/word-search-config";

export function WordSearchBoard({
  letters,
  gridSize,
  foundCount,
  totalWords,
  foundWordPaths,
  selectedCells,
  onClearSelection,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: {
  letters: string[][];
  gridSize: GridSize;
  foundCount: number;
  totalWords: number;
  foundWordPaths: Record<string, CellPosition[]>;
  selectedCells: CellPosition[];
  onClearSelection: () => void;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: React.PointerEvent<HTMLDivElement>) => void;
}) {
  const foundCells = new Set(Object.values(foundWordPaths).flatMap((path) => path.map(({ row, column }) => `${row}:${column}`)));

  return (
    <Card className="word-search-board-card order-2 min-w-0 p-3 sm:p-5 lg:order-1">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1 text-sm text-slate-500"><span>{foundCount} / {totalWords} found</span><button type="button" onClick={onClearSelection} disabled={selectedCells.length === 0} className="text-blue-600 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-40">Clear selection</button></div>
      <div className="min-w-0 overflow-hidden md:pb-2" aria-label={`${gridSize} by ${gridSize} letter grid`}>
        <div onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel} className={`word-search-grid word-search-game-grid word-search-grid--${gridSize} mx-auto grid ${gridSize === 10 ? "gap-[2px]" : "gap-px"} touch-none select-none`}>
          {letters.flatMap((row, rowIndex) => row.map((letter, columnIndex) => {
            const selected = selectedCells.some((cell) => cell.row === rowIndex && cell.column === columnIndex);
            const found = foundCells.has(`${rowIndex}:${columnIndex}`);
            return <button key={`${rowIndex}-${columnIndex}`} type="button" data-cell-row={rowIndex} data-cell-column={columnIndex} aria-label={`Row ${rowIndex + 1}, column ${columnIndex + 1}, ${letter}`} aria-pressed={selected || found} className={`grid aspect-square min-h-0 min-w-0 w-full place-items-center rounded-[5px] p-0 font-semibold leading-none transition ${gridSize === 20 ? "text-[8px] lg:text-base" : gridSize === 15 ? "text-[10px] lg:text-xl" : "text-sm lg:text-[28px]"} ${found ? "bg-emerald-100 text-emerald-800" : selected ? "bg-blue-600 text-white ring-2 ring-blue-200" : "bg-slate-50 text-slate-700 hover:bg-blue-50"}`}>{letter}</button>;
          }))}
        </div>
      </div>
      <p aria-live="polite" className="mt-2 hidden px-1 text-xs text-slate-500 md:block">{selectedCells.length > 0 ? `${selectedCells.length} letter${selectedCells.length === 1 ? "" : "s"} selected. Release to check the word.` : "Click and drag from the first letter to the last, then release. Words run left-to-right, top-to-bottom, or diagonally."}</p>
    </Card>
  );
}
