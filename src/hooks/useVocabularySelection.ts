"use client";

import { useEffect, useRef, useState } from "react";

import type { VocabularyWord } from "@/data/vocabulary";

export function useVocabularySelection(pageWords: VocabularyWord[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const selectPageRef = useRef<HTMLInputElement>(null);

  const selectedOnPage = pageWords.filter((word) => selectedIds.has(word.id)).length;
  const isPageSelected = pageWords.length > 0 && selectedOnPage === pageWords.length;
  const isPagePartiallySelected = selectedOnPage > 0 && selectedOnPage < pageWords.length;

  useEffect(() => {
    if (selectPageRef.current) selectPageRef.current.indeterminate = isPagePartiallySelected;
  }, [isPagePartiallySelected]);

  function toggleSelected(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePageSelection() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (isPageSelected) pageWords.forEach((word) => next.delete(word.id));
      else pageWords.forEach((word) => next.add(word.id));
      return next;
    });
  }

  return {
    selectedIds,
    setSelectedIds,
    selectPageRef,
    isPageSelected,
    isPagePartiallySelected,
    toggleSelected,
    togglePageSelection,
  };
}
