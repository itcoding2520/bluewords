"use client";

import { useCallback, useMemo, useState } from "react";

import type { WordSearchSessionRow } from "@/types/database";
import { getCachedWordSearchSessions, getWordSearchSessions } from "@/lib/supabase/word-search-history";

export function useWordSearchHistory(userId: string | null) {
  const [historyData, setHistoryData] = useState<{ rows: WordSearchSessionRow[]; total: number }>({ rows: [], total: 0 });
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const loadHistory = useCallback(async (forceRefresh = false, page = historyPage) => {
    if (!userId) return;
    const cached = getCachedWordSearchSessions(userId, page, 10);
    if (cached && !forceRefresh) {
      setHistoryData({ rows: cached.rows, total: cached.total });
      setHistoryError("");
      setHistoryLoading(false);
      return;
    }

    setHistoryLoading(!cached);
    setHistoryError("");
    try {
      const result = await getWordSearchSessions({ page, pageSize: 10, forceRefresh });
      setHistoryData({ rows: result.rows, total: result.total });
    } catch {
      setHistoryError("Could not load game history. Please try again.");
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPage, userId]);

  const { fastestSeconds, averageWordsPerRound } = useMemo(() => {
    let fastest: number | null = null;
    let totalWords = 0;
    for (const item of historyData.rows) {
      if (fastest === null || item.duration_seconds < fastest) {
        fastest = item.duration_seconds;
      }
      totalWords += item.word_count;
    }
    return {
      fastestSeconds: fastest,
      averageWordsPerRound: historyData.rows.length ? Math.round(totalWords / historyData.rows.length) : 0,
    };
  }, [historyData.rows]);

  return {
    history: historyData.rows,
    historyPage,
    setHistoryPage,
    historyTotal: historyData.total,
    historyLoading,
    historyError,
    loadHistory,
    fastestSeconds,
    averageWordsPerRound,
  };
}
