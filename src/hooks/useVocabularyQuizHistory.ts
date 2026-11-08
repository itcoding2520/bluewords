"use client";

import { useCallback } from "react";

import type { VocabularyQuizSessionRow } from "@/types/database";
import { useQuizHistoryList } from "@/hooks/useQuizHistoryList";
import { useVocabularyQuizReview } from "@/hooks/useVocabularyQuizReview";

export function useVocabularyQuizHistory(userId: string | null) {
  const list = useQuizHistoryList(userId);
  const { clearHistoryError } = list;
  const review = useVocabularyQuizReview(userId);
  const { openHistoryReview: loadHistoryReview } = review;

  const openHistoryReview = useCallback((session: VocabularyQuizSessionRow) => {
    clearHistoryError();
    void loadHistoryReview(session);
  }, [clearHistoryError, loadHistoryReview]);

  return {
    ...list,
    historyError: list.historyError || review.reviewError,
    selectedHistory: review.selectedHistory,
    setSelectedHistory: review.setSelectedHistory,
    historyAnswers: review.historyAnswers,
    reviewLoading: review.reviewLoading,
    openHistoryReview,
  };
}
