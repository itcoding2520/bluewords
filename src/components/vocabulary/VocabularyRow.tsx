"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Circle,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

import {
  categoryStyles,
  type VocabularyMeaning,
  type VocabularyWord,
} from "@/data/vocabulary";
import { cn } from "@/lib/cn";

interface VocabularyRowProps {
  item: VocabularyWord;
  onToggleMastered: (id: string) => Promise<boolean>;
  onEdit: (word: VocabularyWord) => void;
  onDelete: (word: VocabularyWord) => void;
}

function DetailedMeanings({
  meanings,
}: {
  meanings?: VocabularyMeaning[];
}) {
  if (!meanings?.length) return null;

  return (
    <ul aria-label="Detailed meanings" className="mt-2 space-y-1.5">
      {meanings.map((meaning, index) => (
        <li
          key={meaning.id ?? `${meaning.partOfSpeech}-${index}`}
          className="break-words text-xs text-slate-500"
        >
          <span className="mr-1.5 inline-flex rounded-md bg-blue-50 px-1.5 py-0.5 font-medium capitalize text-blue-700">
            {meaning.partOfSpeech}
          </span>
          {meaning.meaning}
        </li>
      ))}
    </ul>
  );
}

export function VocabularyRow({
  item,
  onToggleMastered,
  onEdit,
  onDelete,
}: VocabularyRowProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const togglingRef = useRef(false);
  const mastered = item.status === "mastered";

  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  async function handleToggleMastered() {
    if (togglingRef.current) return;

    togglingRef.current = true;
    setIsToggling(true);

    try {
      await onToggleMastered(item.id);
    } finally {
      togglingRef.current = false;
      setIsToggling(false);
    }
  }

  return (
    <div className="border-b border-slate-100 px-4 py-4 last:border-none sm:px-6 sm:py-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_36px] lg:items-center lg:gap-5">
        {/* Word */}
        <div className="min-w-0">
          <p className="break-words font-semibold text-slate-950">
            {item.word}
          </p>

          <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
            {item.type === "expression" ? "Expression" : "Word"}
          </span>

          <div className="mt-1 lg:hidden">
            <p className="break-words text-sm text-slate-500">
              {item.meaning}
            </p>
            <DetailedMeanings meanings={item.detailedMeanings} />
          </div>
        </div>

        {/* Meaning - desktop */}
        <div className="hidden min-w-0 text-sm text-slate-500 lg:block">
          <p className="break-words">{item.meaning}</p>
          <DetailedMeanings meanings={item.detailedMeanings} />
        </div>

        {/* Category */}
        <div className="col-start-1 row-start-2 lg:col-auto lg:row-auto">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
              categoryStyles[item.category] ??
              "bg-slate-100 text-slate-600"
            }`}
          >
            {item.category}
          </span>
        </div>

        {/* Status */}
        <button
          type="button"
          onClick={() => void handleToggleMastered()}
          disabled={isToggling}
          aria-label={`Mark ${item.word} as ${
            mastered ? "learning" : "mastered"
          }`}
          aria-pressed={mastered}
          aria-busy={isToggling}
          className={cn(
            "col-start-1 cursor-pointer row-start-3 inline-flex w-fit items-center gap-1.5 rounded-lg py-1 text-sm font-medium transition",
            "lg:col-auto lg:row-auto",
            "disabled:cursor-wait disabled:opacity-60",
            mastered
              ? "text-emerald-600 hover:text-emerald-700"
              : "text-amber-600 hover:text-amber-700"
          )}
        >
          {mastered ? <Check size={15} /> : <Circle size={14} />}

          {isToggling
            ? "Saving..."
            : mastered
              ? "Mastered"
              : "Learning"}
        </button>

        {/* Actions */}
        <div
          ref={menuRef}
          className="relative col-start-2 row-start-1 justify-self-end lg:col-auto lg:row-auto"
        >
          <button
            ref={triggerRef}
            type="button"
            aria-label={`Actions for ${item.word}`}
            aria-expanded={isMenuOpen}
            aria-haspopup="true"
            onClick={() => setIsMenuOpen((current) => !current)}
            className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:border-none focus-visible:outline-none"
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
                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
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
                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
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