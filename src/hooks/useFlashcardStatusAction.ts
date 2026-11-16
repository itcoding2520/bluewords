import { useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";

import type { VocabularyStatus, VocabularyWord } from "@/data/vocabulary";
import type { Flashcard } from "@/lib/flashcards/deck";
import { buildFlashcardDeck, filterFlashcardWords, shuffleDeck } from "@/lib/flashcards/deck";
import { recordVocabularyReview } from "@/lib/supabase/reviews";
import type { VocabularyReviewScheduleRow } from "@/types/database";
import type { FlashcardReviewMode } from "@/types/flashcards";

interface UseFlashcardStatusActionOptions {
  card: Flashcard | undefined;
  words: VocabularyWord[];
  category: string;
  shuffleSeed: number;
  isAuthenticated: boolean;
  toggleMastered: (
    id: string,
    currentStatus?: VocabularyStatus
  ) => Promise<boolean>;
  setStatus: Dispatch<SetStateAction<VocabularyStatus>>;
  setReviewMode: Dispatch<SetStateAction<FlashcardReviewMode>>;
  setIndex: Dispatch<SetStateAction<number>>;
  setIsRevealed: Dispatch<SetStateAction<boolean>>;
  setReviewSchedules: Dispatch<
    SetStateAction<Map<string, VocabularyReviewScheduleRow>>
  >;
}

export function useFlashcardStatusAction({
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
}: UseFlashcardStatusActionOptions) {
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

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
          filterFlashcardWords(
            words.map((word) => word.id === card.word.id ? { ...word, status: nextStatus } : word),
            category,
            nextStatus,
          )
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

  return { isTogglingStatus, handleToggleStatus };
}
