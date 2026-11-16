"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { VocabularyQuizSessionRow } from "@/types/database";
import { getCachedVocabularyQuizHistory, getVocabularyQuizHistory } from "@/lib/supabase/quiz";

/** Owns the paginated, cached list of the signed-in user's quiz attempts. */
export function useQuizHistoryList(userId: string | null) {
  const [historyData, setHistoryData] = useState<{
    ownerId: string | null;
    rows: VocabularyQuizSessionRow[];
    total: number;
  }>({ ownerId: null, rows: [], total: 0 });
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const historyRequestId = useRef(0);

  useEffect(() => {
    historyRequestId.current += 1;
  }, [userId]);

  const loadHistory = useCallback(async (
    forceRefresh = false,
    page = historyPage,
    pageSize = historyPageSize
  ) => {
    const requestId = ++historyRequestId.current;
    if (!userId) return;
    const targetPage = historyData.ownerId === userId ? page : 1;
    if (targetPage !== page) setHistoryPage(targetPage);
    if (historyData.ownerId !== userId) {
      setHistoryData({ ownerId: userId, rows: [], total: 0 });
      setHistoryError("");
    }
    const cachedHistory = getCachedVocabularyQuizHistory(userId, targetPage, pageSize);
    if (cachedHistory && !forceRefresh) {
      setHistoryData({ ownerId: userId, rows: cachedHistory.rows, total: cachedHistory.total });
      setHistoryError("");
      setHistoryLoading(false);
      return;
    }

    setHistoryLoading(!cachedHistory);
    setHistoryError("");
    try {
      const result = await getVocabularyQuizHistory({ page: targetPage, pageSize, forceRefresh });
      if (requestId !== historyRequestId.current) return;
      setHistoryData({ ownerId: userId, rows: result.rows, total: result.total });
    } catch {
      if (requestId !== historyRequestId.current) return;
      setHistoryError("Could not load quiz history. Please try again.");
    } finally {
      if (requestId === historyRequestId.current) setHistoryLoading(false);
    }
  }, [historyData.ownerId, historyPage, historyPageSize, userId]);

  const refreshHistory = useCallback(() => loadHistory(true), [loadHistory]);

  const changeHistoryPageSize = useCallback((pageSize: number) => {
    setHistoryPageSize(pageSize);
    setHistoryPage(1);
    void loadHistory(false, 1, pageSize);
  }, [loadHistory]);

  const changeHistoryPage = useCallback((page: number) => {
    setHistoryPage(page);
    void loadHistory(false, page);
  }, [loadHistory]);
  const clearHistoryError = useCallback(() => setHistoryError(""), []);

  const ownsHistory = userId !== null && historyData.ownerId === userId;
  return {
    history: ownsHistory ? historyData.rows : [],
    historyPage,
    setHistoryPage,
    historyPageSize,
    setHistoryPageSize,
    historyTotal: ownsHistory ? historyData.total : 0,
    historyLoading: ownsHistory ? historyLoading : false,
    historyError: ownsHistory ? historyError : "",
    clearHistoryError,
    loadHistory,
    refreshHistory,
    changeHistoryPageSize,
    changeHistoryPage,
  };
}
