import { useState } from "react";
import type { VocabularyStatus } from "@/data/vocabulary";
import type { FlashcardReviewMode } from "@/types/flashcards";

export function useFlashcardNavigation(loadReviewSchedules: () => Promise<unknown>) {
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<VocabularyStatus>("learning");
  const [index, setIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [reviewMode, setReviewMode] = useState<FlashcardReviewMode>("all");

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

  function moveCard(offset: number, deckLength: number) {
    setIndex((current) => (current + offset + deckLength) % deckLength);
    setIsRevealed(false);
  }

  function changeReviewMode(value: FlashcardReviewMode) {
    setReviewMode(value);
    setIndex(0);
    setIsRevealed(false);
    if (value === "due") void loadReviewSchedules();
  }

  return {
    category,
    status,
    index,
    isRevealed,
    reviewMode,
    setStatus,
    setReviewMode,
    setIndex,
    setIsRevealed,
    changeCategory,
    changeStatus,
    moveCard,
    changeReviewMode,
  };
}
