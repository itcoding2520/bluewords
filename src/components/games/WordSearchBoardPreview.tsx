import Image from "next/image";
import { Info } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { PREVIEW_LETTERS, type Difficulty, type GridSize } from "@/lib/word-search-config";

export function WordSearchBoardPreview({ gridSize, difficulty, wordCount }: { gridSize: GridSize; difficulty: Difficulty; wordCount: number }) {
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
