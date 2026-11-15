"use client";

import { useEffect, useState } from "react";

import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import type { CategoryFilter, VocabularyStatusFilter } from "@/lib/vocabulary/filters";

export function useVocabularyContentFilters(categories: VocabularyCategoryRow[]) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [status, setStatus] = useState<VocabularyStatusFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const selectedCategory =
    category === "All" || categories.some((item) => item.name === category)
      ? category
      : "All";

  return {
    search,
    setSearch,
    category,
    setCategory,
    status,
    setStatus,
    page,
    setPage,
    pageSize,
    setPageSize,
    debouncedSearch,
    selectedCategory,
  };
}
