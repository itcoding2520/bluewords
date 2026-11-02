"use client";

import { useCallback, useState } from "react";

import type { WordSearchSessionRow } from "@/types/database";
import { getCachedWordSearchSessions, getWordSearchSessions } from "@/lib/supabase/word-search-history";

export function useWordSearchHistory(userId: string | null) {
  const [history, setHistory] = useState<WordSearchSessionRow[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const loadHistory = useCallback(async (forceRefresh = false, page = historyPage) => {
    if (!userId) return;
    const cached = getCachedWordSearchSessions(userId, page, 10);
    if (cached && !forceRefresh) {
      setHistory(cached.rows);
      setHistoryTotal(cached.total);
      setHistoryError("");
      setHistoryLoading(false);
      return;
    }

    setHistoryLoading(!cached);
    setHistoryError("");
    try {
      const result = await getWordSearchSessions({ page, pageSize: 10, forceRefresh });
      setHistory(result.rows);
      setHistoryTotal(result.total);
    } catch {
      setHistoryError("Could not load game history. Please try again.");
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPage, userId]);

  const fastestSeconds = history.reduce<number | null>((best, item) => best === null || item.duration_seconds < best ? item.duration_seconds : best, null);
  const averageWordsPerRound = history.length ? Math.round(history.reduce((total, item) => total + item.word_count, 0) / history.length) : 0;

  return {
    history,
    historyPage,
    setHistoryPage,
    historyTotal,
    historyLoading,
    historyError,
    loadHistory,
    fastestSeconds,
    averageWordsPerRound,
  };
}
