"use client";

import { useEffect, useState } from "react";

import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { getVocabularyWordPage } from "@/lib/supabase/vocabulary";

export function useVocabularyCategoryExportCount({
  authVersion,
  categories,
  pageWordCount,
  selectedCategory,
}: {
  authVersion: number;
  categories: VocabularyCategoryRow[];
  pageWordCount: number;
  selectedCategory: string;
}) {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedCategory === "All") return;
    let cancelled = false;

    void getVocabularyWordPage({
      page: 1,
      pageSize: 1,
      search: "",
      category: selectedCategory,
    }).then(({ total }) => {
      if (!cancelled) {
        setCount(total);
        setIsLoading(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setCount(0);
        setIsLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [authVersion, categories, pageWordCount, selectedCategory]);

  return { count, isLoading, setIsLoading };
}
