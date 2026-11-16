"use client";

import { useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import type { CategoryFilter, VocabularyStatusFilter } from "@/lib/vocabulary/filters";

export function useVocabularyContentFilters(categories: VocabularyCategoryRow[]) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [status, setStatus] = useState<VocabularyStatusFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const debouncedSearch = useDebouncedValue(search, 250);

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
