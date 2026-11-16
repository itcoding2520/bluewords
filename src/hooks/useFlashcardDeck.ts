import { useMemo } from "react";
import type { VocabularyStatus, VocabularyWord } from "@/data/vocabulary";
import type { VocabularyReviewScheduleRow } from "@/types/database";
import { buildFlashcardDeck, filterFlashcardWords, shuffleDeck } from "@/lib/flashcards/deck";
import type { FlashcardReviewMode } from "@/types/flashcards";

function isFlashcardDue(dueAt: string | undefined, now: number): boolean {
  return !dueAt || new Date(dueAt).getTime() <= now;
}

export function useFlashcardDeck(input: {
  words: VocabularyWord[];
  category: string;
  status: VocabularyStatus;
  reviewMode: FlashcardReviewMode;
  reviewSchedules: Map<string, VocabularyReviewScheduleRow>;
  areSchedulesLoaded: boolean;
  now: number;
  shuffleSeed: number;
}) {
  const categoryWords = useMemo(
    () => filterFlashcardWords(input.words, input.category),
    [input.category, input.words]
  );

  const statusCounts = useMemo(() => categoryWords.reduce((counts, word) => {
    counts[word.status] += 1;
    return counts;
  }, { learning: 0, mastered: 0 }), [categoryWords]);

  const { deck, dueCount } = useMemo(() => {
    const filteredWords: VocabularyWord[] = [];
    let dueCount = 0;
    for (const word of categoryWords) {
      if (word.status !== input.status) continue;
      const isDue = isFlashcardDue(input.reviewSchedules.get(word.id)?.due_at, input.now);
      if (isDue) dueCount += 1;
      if (input.reviewMode === "all" || (input.areSchedulesLoaded && isDue)) filteredWords.push(word);
    }

    return {
      deck: shuffleDeck(buildFlashcardDeck(filteredWords), input.shuffleSeed),
      dueCount,
    };
  }, [categoryWords, input.areSchedulesLoaded, input.now, input.reviewMode, input.reviewSchedules, input.shuffleSeed, input.status]);

  return { statusCounts, deck, dueCount };
}
