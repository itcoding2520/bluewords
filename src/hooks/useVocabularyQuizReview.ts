"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { VocabularyQuizAnswerRow, VocabularyQuizSessionRow } from "@/types/database";
import {
  getCachedVocabularyQuizAnswers,
  getVocabularyQuizAnswers,
} from "@/lib/supabase/quiz";

/** Loads the private answer review for one of the current user's quiz sessions. */
export function useVocabularyQuizReview(userId: string | null) {
  const [selectedHistory, setSelectedHistory] = useState<VocabularyQuizSessionRow | null>(null);
  const [historyAnswers, setHistoryAnswers] = useState<VocabularyQuizAnswerRow[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewOwnerId, setReviewOwnerId] = useState<string | null>(null);
  const reviewRequestId = useRef(0);

  useEffect(() => {
    reviewRequestId.current += 1;
  }, [userId]);

  const openHistoryReview = useCallback(async (session: VocabularyQuizSessionRow) => {
    const requestId = ++reviewRequestId.current;
    if (!userId) return;
    if (reviewOwnerId !== userId || selectedHistory?.id !== session.id) setHistoryAnswers([]);
    setSelectedHistory(session);
    setReviewOwnerId(userId);
    setReviewError("");

    const cachedAnswers = getCachedVocabularyQuizAnswers(userId, session.id);
    if (cachedAnswers) {
      setHistoryAnswers(cachedAnswers);
      setReviewLoading(false);
      return;
    }

    setReviewLoading(true);
    try {
      const answers = await getVocabularyQuizAnswers(session.id);
      if (requestId === reviewRequestId.current) {
        setHistoryAnswers(answers);
      }
    } catch {
      if (requestId === reviewRequestId.current) {
        setHistoryAnswers([]);
        setReviewError("Could not load this quiz review. Please try again.");
      }
    } finally {
      if (requestId === reviewRequestId.current) setReviewLoading(false);
    }
  }, [reviewOwnerId, selectedHistory?.id, userId]);

  const ownsReview = userId !== null && reviewOwnerId === userId;

  return {
    selectedHistory: ownsReview ? selectedHistory : null,
    setSelectedHistory,
    historyAnswers: ownsReview ? historyAnswers : [],
    reviewLoading: ownsReview ? reviewLoading : false,
    reviewError: ownsReview ? reviewError : "",
    openHistoryReview,
  };
}
