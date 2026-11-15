import { useMemo } from "react";
import type { VocabularyStatus, VocabularyWord } from "@/data/vocabulary";
import type { VocabularyReviewScheduleRow } from "@/types/database";
import { matchesVocabularyCategory } from "@/lib/vocabulary/category-filter";
import { buildFlashcardDeck, shuffleDeck } from "@/lib/flashcards/deck";

function isFlashcardDue(dueAt: string | undefined, now: number): boolean {
  return !dueAt || new Date(dueAt).getTime() <= now;
}

export function useFlashcardDeck(input: {
  words: VocabularyWord[];
  category: string;
  status: VocabularyStatus;
  reviewMode: "all" | "due";
  reviewSchedules: Map<string, VocabularyReviewScheduleRow>;
  areSchedulesLoaded: boolean;
  now: number;
  shuffleSeed: number;
}) {
  const categoryWords = useMemo(
    () => input.words.filter((word) => matchesVocabularyCategory(word.category, input.category)),
    [input.category, input.words]
  );

  const statusCounts = useMemo(() => ({
    learning: categoryWords.filter((word) => word.status === "learning").length,
    mastered: categoryWords.filter((word) => word.status === "mastered").length,
  }), [categoryWords]);

  const deck = useMemo(() => {
    const filteredWords = categoryWords.filter((word) => {
      if (word.status !== input.status) return false;
      if (input.reviewMode === "all") return true;
      if (!input.areSchedulesLoaded) return false;
      return isFlashcardDue(input.reviewSchedules.get(word.id)?.due_at, input.now);
    });
    return shuffleDeck(buildFlashcardDeck(filteredWords), input.shuffleSeed);
  }, [categoryWords, input.areSchedulesLoaded, input.now, input.reviewMode, input.reviewSchedules, input.shuffleSeed, input.status]);

  const dueCount = useMemo(() => categoryWords.filter((word) => {
    if (word.status !== input.status) return false;
    return isFlashcardDue(input.reviewSchedules.get(word.id)?.due_at, input.now);
  }).length, [categoryWords, input.now, input.reviewSchedules, input.status]);

  return { statusCounts, deck, dueCount };
}
