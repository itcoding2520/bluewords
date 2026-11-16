"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryColor } from "@/config/vocabulary";
import { CATEGORY_BADGE_STYLES } from "@/components/vocabulary/category-dropdown-styles";
import { useVocabularyImageUrl } from "@/hooks/useVocabularyImageUrl";
import { PronunciationButton } from "@/components/vocabulary/PronunciationButton";
import { Card } from "@/components/ui/Card";
import { scheduleDeferredTask } from "@/lib/schedule-deferred-task";

function GuestWordRow({ word, color }: { word: VocabularyWord; color: VocabularyCategoryColor }) {
  const rowRef = useRef<HTMLLIElement>(null);
  const [nearViewport, setNearViewport] = useState(false);

  useEffect(() => {
    const row = rowRef.current;
    if (!row || !word.imagePath) return;
    if (!("IntersectionObserver" in window)) {
      return scheduleDeferredTask(() => setNearViewport(true));
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setNearViewport(true);
        observer.disconnect();
      }
    }, { rootMargin: "400px 0px" });
    observer.observe(row);
    return () => observer.disconnect();
  }, [word.imagePath]);

  const starterImageUrl = useVocabularyImageUrl(word.imagePath, nearViewport);
  const imageUrl = word.imageUrl ?? starterImageUrl;

  return (
    <li ref={rowRef} className="guest-vocabulary-row grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {imageUrl ? (
          <Image src={imageUrl} alt={`Illustration for ${word.word}`} width={56} height={56} unoptimized className="size-12 shrink-0 rounded-xl border border-slate-100 bg-slate-50 object-cover sm:size-14" />
        ) : (
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-lg font-bold text-blue-400 sm:size-14" aria-hidden="true">{word.word.slice(0, 1).toUpperCase()}</span>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-1"><p className="break-words font-bold text-slate-900">{word.word}</p><PronunciationButton word={word.word} /></div>
          <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{word.type === "expression" ? "Expression" : "Word"}</span>
        </div>
      </div>
      <p className="min-w-0 break-words text-sm leading-5 text-slate-600">{word.meaning}</p>
      <span className={`col-span-2 w-fit rounded-full px-3 py-1.5 text-xs font-semibold sm:col-span-1 ${CATEGORY_BADGE_STYLES[color]}`}>{word.category}</span>
    </li>
  );
}

export function GuestVocabularyTable({
  isLoaded,
  pageWords,
  filteredCount,
  page,
  pageCount,
  categoryColor,
  onPrevious,
  onNext,
}: {
  isLoaded: boolean;
  pageWords: VocabularyWord[];
  filteredCount: number;
  page: number;
  pageCount: number;
  categoryColor: (category: string) => VocabularyCategoryColor;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <Card className="guest-vocabulary-list mt-4 overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-slate-100 bg-white/75 px-4 py-3 sm:px-6"><span className="text-xs font-bold uppercase tracking-wide text-slate-500">{filteredCount} public words</span><span className="text-xs text-slate-400">Free to explore</span></div>
        <div className="guest-vocabulary-columns hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] gap-x-4 border-b border-slate-100 bg-slate-50/70 px-6 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-400 sm:grid"><span>Word</span><span>Meaning</span><span>Category</span></div>
        {!isLoaded ? (
          <p role="status" className="p-8 text-center text-sm text-slate-500">Loading vocabulary…</p>
        ) : pageWords.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">No public words match your search.</p>
        ) : (
          <ul className="divide-y divide-slate-100">{pageWords.map((word) => <GuestWordRow key={word.id} word={word} color={categoryColor(word.category)} />)}</ul>
        )}
      </Card>
      <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-500">
        <span>Page {page} of {pageCount}</span>
        <div className="flex gap-2">
          <button type="button" disabled={page <= 1} onClick={onPrevious} className="min-h-9 rounded-xl border border-slate-200 bg-white px-3 font-medium shadow-sm transition hover:bg-slate-50 disabled:opacity-40">Previous</button>
          <button type="button" disabled={page >= pageCount} onClick={onNext} className="min-h-9 rounded-xl border border-slate-200 bg-white px-3 font-medium shadow-sm transition hover:bg-slate-50 disabled:opacity-40">Next</button>
        </div>
      </div>
    </>
  );
}
