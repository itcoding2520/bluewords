"use client";

import { useCallback, useState } from "react";

import type { VocabularyQuizAnswerRow, VocabularyQuizSessionRow } from "@/types/database";
import {
  getCachedVocabularyQuizAnswers,
  getCachedVocabularyQuizHistory,
  getVocabularyQuizAnswers,
  getVocabularyQuizHistory,
} from "@/lib/supabase/quiz";

export function useVocabularyQuizHistory(userId: string | null) {
  const [history, setHistory] = useState<VocabularyQuizSessionRow[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [selectedHistory, setSelectedHistory] = useState<VocabularyQuizSessionRow | null>(null);
  const [historyAnswers, setHistoryAnswers] = useState<VocabularyQuizAnswerRow[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);

  const loadHistory = useCallback(async (
    forceRefresh = false,
    page = historyPage,
    pageSize = historyPageSize
  ) => {
    if (!userId) return;
    const cachedHistory = getCachedVocabularyQuizHistory(userId, page, pageSize);
    if (cachedHistory && !forceRefresh) {
      setHistory(cachedHistory.rows);
      setHistoryTotal(cachedHistory.total);
      setHistoryError("");
      setHistoryLoading(false);
      return;
    }

    setHistoryLoading(!cachedHistory);
    setHistoryError("");
    try {
      const result = await getVocabularyQuizHistory({ page, pageSize, forceRefresh });
      setHistory(result.rows);
      setHistoryTotal(result.total);
    } catch {
      setHistoryError("Could not load quiz history. Please try again.");
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPage, historyPageSize, userId]);

  const openHistoryReview = useCallback(async (session: VocabularyQuizSessionRow) => {
    if (!userId) return;
    setSelectedHistory(session);
    setHistoryError("");
    const cachedAnswers = getCachedVocabularyQuizAnswers(userId, session.id);
    if (cachedAnswers) {
      setHistoryAnswers(cachedAnswers);
      setReviewLoading(false);
      return;
    }
    setReviewLoading(true);
    try {
      setHistoryAnswers(await getVocabularyQuizAnswers(session.id));
    } catch {
      setHistoryAnswers([]);
      setHistoryError("Could not load this quiz review. Please try again.");
    } finally {
      setReviewLoading(false);
    }
  }, [userId]);

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

  return {
    history,
    historyPage,
    setHistoryPage,
    historyPageSize,
    setHistoryPageSize,
    historyTotal,
    historyLoading,
    historyError,
    selectedHistory,
    setSelectedHistory,
    historyAnswers,
    reviewLoading,
    loadHistory,
    refreshHistory,
    changeHistoryPageSize,
    changeHistoryPage,
    openHistoryReview,
  };
}
