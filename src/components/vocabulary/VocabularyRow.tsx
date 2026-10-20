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
  categorySolidColorStyles,
  categorySolidStyles,
  type VocabularyMeaning,
  type VocabularyWord,
} from "@/data/vocabulary";
import { cn } from "@/lib/cn";
import { useVocabulary } from "@/contexts/VocabularyContext";
import { useVocabularyImageUrl } from "@/hooks/useVocabularyImageUrl";
import Image from "next/image";
import { PronunciationButton } from "./PronunciationButton";

interface VocabularyRowProps {
  item: VocabularyWord;
  selected: boolean;
  onToggleSelected: (id: string) => void;
  onToggleMastered: (id: string, currentStatus: VocabularyWord["status"]) => Promise<boolean>;
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
  selected,
  onToggleSelected,
  onToggleMastered,
  onEdit,
  onDelete,
}: VocabularyRowProps) {
  const { categories } = useVocabulary({ loadWords: false, loadCategories: false });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const togglingRef = useRef(false);
  const mastered = item.status === "mastered";
  const categoryColor = categories.find(
    (category) => category.name === item.category
  )?.color;
  const imageUrl = useVocabularyImageUrl(item.imagePath);
  const hasPartOfSpeechMeanings = Boolean(
    item.detailedMeanings?.some((meaning) => meaning.partOfSpeech)
  );

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
      await onToggleMastered(item.id, item.status);
    } finally {
      togglingRef.current = false;
      setIsToggling(false);
    }
  }

  return (
    <div className="border-b border-slate-100 px-4 py-4 last:border-none sm:px-6 sm:py-5">
      <div className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2 lg:grid-cols-[24px_minmax(0,1.2fr)_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_36px] lg:items-center lg:gap-5">
        <div className="col-start-1 row-start-1 flex justify-center pt-1">
          <input
            type="checkbox"
            aria-label={`Select ${item.word}`}
            checked={selected}
            onChange={() => onToggleSelected(item.id)}
            className="size-4 cursor-pointer rounded border-slate-300 accent-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          />
        </div>

        {/* Word */}
        <div className="col-start-2 row-start-1 flex min-w-0 items-start gap-3 lg:items-center">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={`Illustration for ${item.word}`}
              width={48}
              height={48}
              unoptimized
              className="size-12 shrink-0 rounded-lg border border-slate-100 object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className="break-words font-semibold text-slate-950">
                {item.word}
              </p>
              <PronunciationButton word={item.word} />
            </div>

            <span className="mt-1 hidden w-fit rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500 lg:inline-flex">
              {item.type === "expression" ? "Expression" : "Word"}
            </span>

            <div className="mt-1 lg:hidden">
              {!hasPartOfSpeechMeanings && (
                <p className="break-words text-sm text-slate-500">
                  {item.meaning}
                </p>
              )}
              <DetailedMeanings meanings={item.detailedMeanings} />
            </div>
          </div>
        </div>

        {/* Meaning - desktop */}
        <div className="hidden min-w-0 text-sm text-slate-500 lg:col-start-3 lg:block">
          {!hasPartOfSpeechMeanings && (
            <p className="break-words">{item.meaning}</p>
          )}
          <DetailedMeanings meanings={item.detailedMeanings} />
        </div>

        {/* Category and status share a compact row on mobile. */}
        <div className="col-start-2 row-start-2 flex min-w-0 items-center justify-between gap-3 lg:contents">
          <span
            className={`inline-flex w-max max-w-max justify-center rounded-full px-3 py-1 text-xs font-medium lg:col-start-4 lg:row-auto ${
              (categoryColor
                ? categorySolidColorStyles[categoryColor]
                : categorySolidStyles[item.category]) ??
              "bg-slate-600 text-white"
            }`}
          >
            {item.category}
          </span>

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
              "inline-flex w-fit shrink-0 cursor-pointer items-center gap-1.5 rounded-lg py-1 text-sm font-medium transition",
              "lg:col-start-5 lg:row-auto",
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
        </div>

        {/* Actions */}
        <div
          ref={menuRef}
          className="relative col-start-3 row-start-1 justify-self-end lg:col-start-6 lg:row-auto"
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
