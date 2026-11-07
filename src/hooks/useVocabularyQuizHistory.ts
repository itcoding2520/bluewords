"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  const [historyOwnerId, setHistoryOwnerId] = useState<string | null>(null);
  const [reviewOwnerId, setReviewOwnerId] = useState<string | null>(null);
  const historyRequestId = useRef(0);
  const reviewRequestId = useRef(0);

  useEffect(() => {
    historyRequestId.current += 1;
    reviewRequestId.current += 1;
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

  const openHistoryReview = useCallback(async (session: VocabularyQuizSessionRow) => {
    const requestId = ++reviewRequestId.current;
    if (!userId) return;
    if (reviewOwnerId !== userId || selectedHistory?.id !== session.id) setHistoryAnswers([]);
    setSelectedHistory(session);
    setReviewOwnerId(userId);
    setHistoryError("");
    const cachedAnswers = getCachedVocabularyQuizAnswers(userId, session.id);
    if (cachedAnswers) {
      setReviewOwnerId(userId);
      setHistoryAnswers(cachedAnswers);
      setReviewLoading(false);
      return;
    }
    setReviewLoading(true);
    try {
      const answers = await getVocabularyQuizAnswers(session.id);
      if (requestId === reviewRequestId.current) {
        setReviewOwnerId(userId);
        setHistoryAnswers(answers);
      }
    } catch {
      if (requestId === reviewRequestId.current) {
        setHistoryAnswers([]);
        setHistoryError("Could not load this quiz review. Please try again.");
      }
    } finally {
      if (requestId === reviewRequestId.current) setReviewLoading(false);
    }
  }, [reviewOwnerId, selectedHistory?.id, userId]);

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

  const ownsHistory = userId !== null && historyOwnerId === userId;
  const ownsReview = userId !== null && reviewOwnerId === userId;

  return {
    history: ownsHistory ? history : [],
    historyPage,
    setHistoryPage,
    historyPageSize,
    setHistoryPageSize,
    historyTotal: ownsHistory ? historyTotal : 0,
    historyLoading: ownsHistory ? historyLoading : false,
    historyError: ownsHistory ? historyError : "",
    selectedHistory: ownsReview ? selectedHistory : null,
    setSelectedHistory,
    historyAnswers: ownsReview ? historyAnswers : [],
    reviewLoading: ownsReview ? reviewLoading : false,
    loadHistory,
    refreshHistory,
    changeHistoryPageSize,
    changeHistoryPage,
    openHistoryReview,
  };
}
