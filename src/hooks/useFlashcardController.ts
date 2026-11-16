"use client";

import type { VocabularyStatus, VocabularyWord } from "@/data/vocabulary";
import { useFlashcardReviewTime } from "@/hooks/useFlashcardReviewTime";
import { useFlashcardShuffleSeed } from "@/hooks/useFlashcardShuffleSeed";
import { useFlashcardReviewSchedules } from "@/hooks/useFlashcardReviewSchedules";
import { useFlashcardStatusAction } from "@/hooks/useFlashcardStatusAction";
import { useFlashcardDeck } from "@/hooks/useFlashcardDeck";
import { useFlashcardNavigation } from "@/hooks/useFlashcardNavigation";

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
  const {
    reviewSchedules,
    setReviewSchedules,
    areSchedulesLoaded,
    isLoadingSchedules,
    scheduleLoadFailed,
    loadReviewSchedules,
  } = useFlashcardReviewSchedules(isAuthenticated);
  const navigation = useFlashcardNavigation(loadReviewSchedules);
  const { category, status, index, isRevealed, reviewMode } = navigation;

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
    setStatus: navigation.setStatus,
    setReviewMode: navigation.setReviewMode,
    setIndex: navigation.setIndex,
    setIsRevealed: navigation.setIsRevealed,
    setReviewSchedules,
  });

  return {
    filters: {
      category,
      status,
      reviewMode,
      statusCounts,
      dueCount,
      changeCategory: navigation.changeCategory,
      changeStatus: navigation.changeStatus,
      changeReviewMode: navigation.changeReviewMode,
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
      moveCard: (offset: number) => navigation.moveCard(offset, deck.length),
    },
    card: {
      isRevealed,
      setIsRevealed: navigation.setIsRevealed,
      isTogglingStatus,
      toggleStatus: handleToggleStatus,
    },
  };
}
