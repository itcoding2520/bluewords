"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { VocabularyStatus, VocabularyWord } from "@/data/vocabulary";
import { useFlashcardReviewTime, useFlashcardShuffleSeed } from "@/hooks/useFlashcardSession";
import { useFlashcardReviewSchedules } from "@/hooks/useFlashcardReviewSchedules";
import { buildFlashcardDeck, shuffleDeck } from "@/lib/flashcards/deck";
import { recordVocabularyReview } from "@/lib/supabase/reviews";

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
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [reviewMode, setReviewMode] = useState<"all" | "due">("all");
  const {
    reviewSchedules,
    setReviewSchedules,
    areSchedulesLoaded,
    isLoadingSchedules,
    scheduleLoadFailed,
    loadReviewSchedules,
  } = useFlashcardReviewSchedules(isAuthenticated);

  const statusCounts = useMemo(() => {
    const categoryWords = words.filter((word) => category === "all" || word.category === category);
    return {
      learning: categoryWords.filter((word) => word.status === "learning").length,
      mastered: categoryWords.filter((word) => word.status === "mastered").length,
    };
  }, [category, words]);

  const deck = useMemo(() => {
    const filteredWords = words.filter((word) => {
      if (word.status !== status || (category !== "all" && word.category !== category)) return false;
      if (reviewMode === "all") return true;
      if (!areSchedulesLoaded) return false;
      const schedule = reviewSchedules.get(word.id);
      return !schedule || new Date(schedule.due_at).getTime() <= now;
    });
    return shuffleDeck(buildFlashcardDeck(filteredWords), shuffleSeed);
  }, [areSchedulesLoaded, category, now, reviewMode, reviewSchedules, shuffleSeed, status, words]);

  const dueCount = useMemo(() => words.filter((word) => {
    if (word.status !== status || (category !== "all" && word.category !== category)) return false;
    const schedule = reviewSchedules.get(word.id);
    return !schedule || new Date(schedule.due_at).getTime() <= now;
  }).length, [category, now, reviewSchedules, status, words]);

  const card = deck.length > 0 ? deck[index % deck.length] : undefined;

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

  async function handleToggleStatus() {
    if (!isAuthenticated || !card || card.word.isCustom || isTogglingStatus) return;

    const remembered = card.word.status === "learning";
    const nextStatus: VocabularyStatus = remembered ? "mastered" : "learning";
    setIsTogglingStatus(true);
    try {
      const updated = await toggleMastered(card.word.id, card.word.status);
      if (!updated) return;

      const nextDeck = shuffleDeck(
        buildFlashcardDeck(
          words
            .map((word) => word.id === card.word.id ? { ...word, status: nextStatus } : word)
            .filter((word) => word.status === nextStatus && (category === "all" || word.category === category))
        ),
        shuffleSeed
      );
      setStatus(nextStatus);
      setReviewMode("all");
      setIndex(Math.max(0, nextDeck.findIndex((item) => item.word.id === card.word.id)));
      setIsRevealed(false);

      try {
        const { schedule } = await recordVocabularyReview(card.word.id, remembered);
        setReviewSchedules((current) => {
          const next = new Map(current);
          next.set(schedule.vocabulary_word_id, schedule);
          return next;
        });
      } catch (error) {
        console.error("Failed to save flashcard review:", error);
        toast.error("Status changed, but review activity could not be recorded.");
      }
    } finally {
      setIsTogglingStatus(false);
    }
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
