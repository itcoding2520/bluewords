"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import { toast } from "sonner";
import { getPageCount } from "@/lib/pagination";
import {
  getInitialCachedVocabularyPage,
  loadVocabularyPage,
  type VocabularyPageQuery,
} from "@/lib/vocabulary/page-data";

export function useVocabularyPageData({
  authVersion,
  categoriesLoaded,
  query,
  onPageOutOfRange,
}: {
  authVersion: number;
  categoriesLoaded: boolean;
  query: VocabularyPageQuery;
  onPageOutOfRange: (page: number) => void;
}) {
  const { page, pageSize, search, category, status } = query;
  const [initialCachedPage] = useState(() => getInitialCachedVocabularyPage(authVersion));
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

    void loadVocabularyPage(authVersion, currentQuery).then((result) => {
      if (cancelled || requestId !== requestIdRef.current) return;
      setTotalWords(result.total);
      const resultPageCount = getPageCount(result.total, pageSize);
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
  }, [authVersion, categoriesLoaded, page, pageSize, search, category, status, requestVersion]);

  const refreshPage = useCallback(() => setRequestVersion((version) => version + 1), []);

  return { pageWords, setPageWords, loadedAuthVersion, totalWords, setTotalWords, isPageLoading, setIsPageLoading, refreshPage };
}
