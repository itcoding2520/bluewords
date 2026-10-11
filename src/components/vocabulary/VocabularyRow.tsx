"use client";

import {
  Check,
  Circle,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

import { useState } from "react";
import type { VocabularyWord } from "@/data/vocabulary";

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
  onDelete
}: VocabularyRowProps) {
  const mastered = item.status === "mastered";
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="grid grid-cols-[1.2fr_2fr_1fr_1fr_auto] items-center gap-6 border-b border-slate-100 px-6 py-5 last:border-none">
      <div>
        <p className="font-semibold text-slate-950">
          {item.word}
        </p>
      </div>

      <p className="text-sm text-slate-500">
        {item.meaning}
      </p>

      <div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {item.category}
        </span>
      </div>

      <div>
        <span
          className={
            mastered
              ? "inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600"
              : "text-sm font-medium text-amber-600"
          }
        >
          {mastered && <Check size={15} />}

          {mastered ? "Mastered" : "Learning"}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onToggleMastered(item.id)}
        className={
          mastered
            ? "inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600"
            : "inline-flex items-center gap-1.5 text-sm font-medium text-amber-600"
        }
      >
        {mastered ? (
          <Check size={15} />
        ) : (
          <Circle size={14} />
        )}

        {mastered ? "Mastered" : "Learning"}
      </button>

      <div className="relative">
        <button
          type="button"
          aria-label={`Actions for ${item.word}`}
          onClick={() =>
            setIsMenuOpen((current) => !current)
          }
          className="flex size-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
        >
          <MoreHorizontal size={18} />
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 top-11 z-20 w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
            <button
              type="button"
              onClick={() => {
                onEdit(item);
                setIsMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <Pencil size={15} />
              Edit
            </button>

            <button
              type="button"
              onClick={() => {
                onDelete(item);
                setIsMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
            >
              <Trash2 size={15} />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}