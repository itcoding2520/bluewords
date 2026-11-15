"use client";

import { useState } from "react";

import type { VocabularyStatus, VocabularyWord } from "@/data/vocabulary";
import { useFlashcardReviewTime, useFlashcardShuffleSeed } from "@/hooks/useFlashcardSession";
import { useFlashcardReviewSchedules } from "@/hooks/useFlashcardReviewSchedules";
import { useFlashcardStatusAction } from "@/hooks/useFlashcardStatusAction";
import { useFlashcardDeck } from "@/hooks/useFlashcardDeck";
import type { FlashcardReviewMode } from "@/types/flashcards";

export function useFlashcardController({
  words,
  isAuthenticated,
  toggleMastered,
}: {
  words: VocabularyWord[];
  isAuthenticated: boolean;
  toggleMastered: (id: string, currentStatus?: VocabularyStatus) => Promise<boolean>;
}) {
  const shuffleSeed = useFlashcardShuffleSeed();
  const now = useFlashcardReviewTime();
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<VocabularyStatus>("learning");
  const [index, setIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [reviewMode, setReviewMode] = useState<FlashcardReviewMode>("all");
  const {
    reviewSchedules,
    setReviewSchedules,
    areSchedulesLoaded,
    isLoadingSchedules,
    scheduleLoadFailed,
    loadReviewSchedules,
  } = useFlashcardReviewSchedules(isAuthenticated);

  const { statusCounts, deck, dueCount } = useFlashcardDeck({
    words,
    category,
    status,
    reviewMode,
    reviewSchedules,
    areSchedulesLoaded,
    now,
    shuffleSeed,
  });

  const card = deck.length > 0 ? deck[index % deck.length] : undefined;
  const { isTogglingStatus, handleToggleStatus } = useFlashcardStatusAction({
    card,
    words,
    category,
    shuffleSeed,
    isAuthenticated,
    toggleMastered,
    setStatus,
    setReviewMode,
    setIndex,
    setIsRevealed,
    setReviewSchedules,
  });

  function changeCategory(value: string) {
    setCategory(value);
    setIndex(0);
    setIsRevealed(false);
  }

  function changeStatus(value: VocabularyStatus) {
    setStatus(value);
    setIndex(0);
    setIsRevealed(false);
  }

  function moveCard(offset: number) {
    setIndex((current) => (current + offset + deck.length) % deck.length);
    setIsRevealed(false);
  }

  function changeReviewMode(value: FlashcardReviewMode) {
    setReviewMode(value);
    setIndex(0);
    setIsRevealed(false);
    if (value === "due") void loadReviewSchedules();
  }

  return {
    filters: {
      category,
      status,
      reviewMode,
      statusCounts,
      dueCount,
      changeCategory,
      changeStatus,
      changeReviewMode,
    },
    schedules: {
      areLoaded: areSchedulesLoaded,
      isLoading: isLoadingSchedules,
      loadFailed: scheduleLoadFailed,
      load: loadReviewSchedules,
    },
    deck: {
      cards: deck,
      index,
      currentCard: card,
      moveCard,
    },
    card: {
      isRevealed,
      setIsRevealed,
      isTogglingStatus,
      toggleStatus: handleToggleStatus,
    },
  };
}
