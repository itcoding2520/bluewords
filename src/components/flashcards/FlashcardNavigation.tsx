import { ArrowLeft, ArrowRight, Check, Circle } from "lucide-react";

import { Button } from "@/components/ui/Button";
import type { Flashcard } from "@/lib/flashcards/deck";

interface FlashcardNavigationProps {
  card: Flashcard;
  deckSize: number;
  isAuthenticated: boolean;
  isTogglingStatus: boolean;
  onPrevious: () => void;
  onToggleStatus: () => void;
  onNext: () => void;
}

export function FlashcardNavigation({
  card,
  deckSize,
  isAuthenticated,
  isTogglingStatus,
  onPrevious,
  onToggleStatus,
  onNext,
}: FlashcardNavigationProps) {
  const canChangeStatus = isAuthenticated && !card.word.isCustom;
  const nextStatusLabel = card.word.status === "learning" ? "Mastered" : "Learning";

  return (
    <div className="flashcards-navigation mt-4 flex items-center justify-center gap-3 sm:gap-5">
      {canChangeStatus && (
        <Button variant="secondary" onClick={onPrevious} disabled={deckSize < 2} aria-label="Previous flashcard">
          <ArrowLeft size={16} />
          <span>Previous</span>
        </Button>
      )}
      {canChangeStatus && (
        <Button
          variant="secondary"
          onClick={onToggleStatus}
          disabled={isTogglingStatus}
          aria-label={`Mark ${card.word.word} as ${card.word.status === "learning" ? "mastered" : "learning"}`}
          title={`Change status to ${nextStatusLabel}`}
          className={card.word.status === "learning"
            ? "flashcards-learning-action text-amber-600 hover:bg-amber-50 hover:text-amber-700"
            : "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"}
        >
          {card.word.status === "learning" ? <Circle size={15} /> : <Check size={15} />}
          <span>{isTogglingStatus ? "Saving..." : card.word.status === "learning" ? "Learning" : "Mastered"}</span>
        </Button>
      )}
      <Button onClick={onNext} disabled={deckSize < 2} aria-label="Next flashcard">
        <span>Next</span>
        <ArrowRight size={16} />
      </Button>
    </div>
  );
}
