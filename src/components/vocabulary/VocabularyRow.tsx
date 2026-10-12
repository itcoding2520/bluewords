
"use client";

import { useState } from "react";
import {
  Check,
  Circle,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

import type { VocabularyWord } from "@/data/vocabulary";
import { cn } from "@/lib/cn";

interface VocabularyRowProps {
  item: VocabularyWord;
  onToggleMastered: (id: string) => void;
  onEdit: (word: VocabularyWord) => void;
  onDelete: (word: VocabularyWord) => void;
}

export function VocabularyRow({
  item,
  onToggleMastered,
  onEdit,
  onDelete,
}: VocabularyRowProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const mastered = item.status === "mastered";

  
return (
  <div className="border-b border-slate-100 px-4 py-4 last:border-none sm:px-6 sm:py-5">
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_36px] lg:items-center lg:gap-5">
      {/* Word */}
      <div className="min-w-0">
        <p className="break-words font-semibold text-slate-950">
          {item.word}
        </p>

        <p className="mt-1 break-words text-sm text-slate-500 lg:hidden">
          {item.meaning}
        </p>
      </div>

      {/* Meaning - desktop */}
      <p className="hidden min-w-0 break-words text-sm text-slate-500 lg:block">
        {item.meaning}
      </p>

      {/* Category */}
      <div className="col-start-1 row-start-2 lg:col-auto lg:row-auto">
        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {item.category}
        </span>
      </div>

      {/* Status */}
      <button
        type="button"
        onClick={() => onToggleMastered(item.id)}
        aria-label={`Mark ${item.word} as ${
          mastered ? "learning" : "mastered"
        }`}
        aria-pressed={mastered}
        className={cn(
          "col-start-1 row-start-3 inline-flex w-fit items-center gap-1.5 rounded-lg py-1 text-sm font-medium transition",
          "lg:col-auto lg:row-auto",
          mastered
            ? "text-emerald-600 hover:text-emerald-700"
            : "text-amber-600 hover:text-amber-700"
        )}
      >
        {mastered ? (
          <Check size={15} />
        ) : (
          <Circle size={14} />
        )}

        {mastered ? "Mastered" : "Learning"}
      </button>

      {/* Actions */}
      <div className="relative col-start-2 row-start-1 justify-self-end lg:col-auto lg:row-auto">
        <button
          type="button"
          aria-label={`Actions for ${item.word}`}
          aria-expanded={isMenuOpen}
          aria-haspopup="true"
          onClick={() => setIsMenuOpen((current) => !current)}
          className="cursor-pointer flex size-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <MoreHorizontal size={18} />
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 top-full z-20 mt-2 w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onEdit(item);
              }}
              className="cursor-pointer flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <Pencil size={15} />
              Edit
            </button>

            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(false);
                onDelete(item);
              }}
              className="cursor-pointer flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
            >
              <Trash2 size={15} />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
);

}
