"use client";

import { useMemo, useState } from "react";

import type { VocabularyStatus, VocabularyWord } from "@/data/vocabulary";
import { useFlashcardReviewTime, useFlashcardShuffleSeed } from "@/hooks/useFlashcardSession";
import { useFlashcardReviewSchedules } from "@/hooks/useFlashcardReviewSchedules";
import { buildFlashcardDeck, shuffleDeck } from "@/lib/flashcards/deck";
import { useFlashcardStatusAction } from "@/hooks/useFlashcardStatusAction";

function isFlashcardDue(dueAt: string | undefined, now: number): boolean {
  return !dueAt || new Date(dueAt).getTime() <= now;
}

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
  const [reviewMode, setReviewMode] = useState<"all" | "due">("all");
  const {
    reviewSchedules,
    setReviewSchedules,
    areSchedulesLoaded,
    isLoadingSchedules,
    scheduleLoadFailed,
    loadReviewSchedules,
  } = useFlashcardReviewSchedules(isAuthenticated);

  const categoryWords = useMemo(
    () => words.filter((word) => category === "all" || word.category === category),
    [category, words]
  );

  const statusCounts = useMemo(() => {
    return {
      learning: categoryWords.filter((word) => word.status === "learning").length,
      mastered: categoryWords.filter((word) => word.status === "mastered").length,
    };
  }, [categoryWords]);

  const deck = useMemo(() => {
    const filteredWords = categoryWords.filter((word) => {
      if (word.status !== status) return false;
      if (reviewMode === "all") return true;
      if (!areSchedulesLoaded) return false;
      const schedule = reviewSchedules.get(word.id);
      return isFlashcardDue(schedule?.due_at, now);
    });
    return shuffleDeck(buildFlashcardDeck(filteredWords), shuffleSeed);
  }, [areSchedulesLoaded, categoryWords, now, reviewMode, reviewSchedules, shuffleSeed, status]);

  const dueCount = useMemo(() => categoryWords.filter((word) => {
    if (word.status !== status) return false;
    const schedule = reviewSchedules.get(word.id);
    return isFlashcardDue(schedule?.due_at, now);
  }).length, [categoryWords, now, reviewSchedules, status]);

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

  function changeReviewMode(value: "all" | "due") {
    setReviewMode(value);
    setIndex(0);
    setIsRevealed(false);
    if (value === "due") void loadReviewSchedules();
  }

  return {
    category,
    status,
    index,
    setIsRevealed,
    isRevealed,
    isTogglingStatus,
    reviewMode,
    areSchedulesLoaded,
    isLoadingSchedules,
    scheduleLoadFailed,
    statusCounts,
    deck,
    dueCount,
    card,
    changeCategory,
    changeStatus,
    moveCard,
    changeReviewMode,
    loadReviewSchedules,
    handleToggleStatus,
  };
}
