"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { VocabularyQuizSessionRow } from "@/types/database";
import { useVocabularyQuizReview } from "@/hooks/useVocabularyQuizReview";
import {
  getCachedVocabularyQuizHistory,
  getVocabularyQuizHistory,
} from "@/lib/supabase/quiz";

export function useVocabularyQuizHistory(userId: string | null) {
  const [history, setHistory] = useState<VocabularyQuizSessionRow[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyOwnerId, setHistoryOwnerId] = useState<string | null>(null);
  const review = useVocabularyQuizReview(userId);
  const { openHistoryReview: loadHistoryReview } = review;
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
    const targetPage = historyOwnerId === userId ? page : 1;
    if (targetPage !== page) setHistoryPage(targetPage);
    if (historyOwnerId !== userId) {
      setHistoryOwnerId(userId);
      setHistory([]);
      setHistoryTotal(0);
      setHistoryError("");
    }
    const cachedHistory = getCachedVocabularyQuizHistory(userId, targetPage, pageSize);
    if (cachedHistory && !forceRefresh) {
      setHistoryOwnerId(userId);
      setHistory(cachedHistory.rows);
      setHistoryTotal(cachedHistory.total);
      setHistoryError("");
      setHistoryLoading(false);
      return;
    }

    setHistoryLoading(!cachedHistory);
    setHistoryError("");
    try {
      const result = await getVocabularyQuizHistory({ page: targetPage, pageSize, forceRefresh });
      if (requestId !== historyRequestId.current) return;
      setHistoryOwnerId(userId);
      setHistory(result.rows);
      setHistoryTotal(result.total);
    } catch {
      if (requestId !== historyRequestId.current) return;
      setHistoryError("Could not load quiz history. Please try again.");
    } finally {
      if (requestId === historyRequestId.current) setHistoryLoading(false);
    }
  }, [historyOwnerId, historyPage, historyPageSize, userId]);

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

  const openHistoryReview = useCallback((session: VocabularyQuizSessionRow) => {
    setHistoryError("");
    void loadHistoryReview(session);
  }, [loadHistoryReview]);

  const ownsHistory = userId !== null && historyOwnerId === userId;
  return {
    history: ownsHistory ? history : [],
    historyPage,
    setHistoryPage,
    historyPageSize,
    setHistoryPageSize,
    historyTotal: ownsHistory ? historyTotal : 0,
    historyLoading: ownsHistory ? historyLoading : false,
    historyError: ownsHistory ? historyError || review.reviewError : "",
    selectedHistory: review.selectedHistory,
    setSelectedHistory: review.setSelectedHistory,
    historyAnswers: review.historyAnswers,
    reviewLoading: review.reviewLoading,
    loadHistory,
    refreshHistory,
    changeHistoryPageSize,
    changeHistoryPage,
    openHistoryReview,
  };
}
