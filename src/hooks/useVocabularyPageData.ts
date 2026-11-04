"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { VocabularyStatus, VocabularyWord } from "@/data/vocabulary";
import { getVocabularyWordPage } from "@/lib/supabase/vocabulary";
import { getCachedVocabularyPage, setCachedVocabularyPage } from "@/lib/supabase/vocabulary-page-cache.mjs";
import { mapVocabularyWordRow } from "@/lib/vocabulary/shared-vocabulary";
import { toast } from "sonner";

type PageQuery = { page: number; pageSize: number; search: string; category: string | null; status: VocabularyStatus | null };

export function useVocabularyPageData({
  authVersion,
  categories,
  categoriesLoaded,
  query,
  onPageOutOfRange,
}: {
  authVersion: number;
  categories: unknown[];
  categoriesLoaded: boolean;
  query: PageQuery;
  onPageOutOfRange: (page: number) => void;
}) {
  const { page, pageSize, search, category, status } = query;
  const initialQuery: PageQuery = { page: 1, pageSize: 10, search: "", category: null, status: null };
  const [initialCachedPage] = useState(() => getCachedVocabularyPage(authVersion, initialQuery) as { rows: VocabularyWord[]; total: number } | null);
  const [pageWords, setPageWords] = useState<VocabularyWord[]>(() => initialCachedPage?.rows ?? []);
  const [loadedAuthVersion, setLoadedAuthVersion] = useState<number | null>(() => initialCachedPage ? authVersion : null);
  const [totalWords, setTotalWords] = useState(() => initialCachedPage?.total ?? 0);
  const [isPageLoading, setIsPageLoading] = useState(!initialCachedPage);
  const [requestVersion, setRequestVersion] = useState(0);
  const requestIdRef = useRef(0);
  const pageCallbackRef = useRef(onPageOutOfRange);

  useEffect(() => {
    pageCallbackRef.current = onPageOutOfRange;
  }, [onPageOutOfRange]);
  useEffect(() => {
    if (!categoriesLoaded) return;
    const requestId = ++requestIdRef.current;
    let cancelled = false;
    const currentQuery = { page, pageSize, search, category, status };
    const cachedPage = getCachedVocabularyPage(authVersion, currentQuery) as { rows: VocabularyWord[]; total: number } | null;
    const pageResult = cachedPage
      ? Promise.resolve(cachedPage)
      : getVocabularyWordPage(currentQuery).then((result) => {
          const mappedResult = { rows: result.rows.map(mapVocabularyWordRow), total: result.total };
          setCachedVocabularyPage(authVersion, currentQuery, mappedResult);
          return mappedResult;
        });

    void pageResult.then((result) => {
      if (cancelled || requestId !== requestIdRef.current) return;
      setTotalWords(result.total);
      const resultPageCount = Math.max(1, Math.ceil(result.total / pageSize));
      if (page > resultPageCount) {
        pageCallbackRef.current(resultPageCount);
        return;
      }
      setPageWords(result.rows);
      setLoadedAuthVersion(authVersion);
      setIsPageLoading(false);
    }).catch((error) => {
      if (cancelled || requestId !== requestIdRef.current) return;
      console.error("Failed to load vocabulary page:", error);
      setPageWords([]);
      setTotalWords(0);
      setIsPageLoading(false);
      toast.error("Failed to load vocabulary.");
    });

    return () => { cancelled = true; };
  }, [authVersion, categories, categoriesLoaded, page, pageSize, search, category, status, requestVersion]);

  const refreshPage = useCallback(() => setRequestVersion((version) => version + 1), []);

  return { pageWords, setPageWords, loadedAuthVersion, totalWords, setTotalWords, isPageLoading, setIsPageLoading, refreshPage };
}
