import { FlashcardAnswer, FlashcardWord } from "@/components/flashcards/FlashcardCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Flashcard } from "@/lib/flashcards/deck";

export function FlashcardStage({
  card,
  isRevealed,
  onReveal,
}: {
  card: Flashcard;
  isRevealed: boolean;
  onReveal: (revealed: boolean) => void;
}) {
  return (
    <Card className="flashcard-stage h-[350px] overflow-hidden p-0 sm:h-[480px]">
      <div className="[perspective:1200px] h-full w-full">
        <div
          className="relative h-full w-full transition-transform duration-500 ease-in-out [transform-style:preserve-3d] motion-reduce:transition-none"
          style={{ transform: isRevealed ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          <section
            aria-label="Flashcard front"
            aria-hidden={isRevealed}
            inert={isRevealed}
            className="absolute inset-0 flex flex-col items-center overflow-y-auto px-5 py-6 text-center [backface-visibility:hidden] sm:px-8 sm:py-8"
          >
            <div className="flex w-full flex-1 flex-col items-center justify-center">
              <FlashcardWord card={card} showImage />
            </div>
            <Button
              variant="secondary"
              onClick={() => onReveal(true)}
              className="mt-3 min-w-36 shrink-0"
            >
              Show meaning
            </Button>
          </section>

          <section
            aria-label="Flashcard answer"
            aria-hidden={!isRevealed}
            inert={!isRevealed}
            className="absolute inset-0 flex flex-col items-center overflow-y-auto px-5 py-6 text-center [backface-visibility:hidden] sm:px-8 sm:py-8"
            style={{ transform: "rotateY(180deg)" }}
          >
            <div className="flex w-full flex-1 flex-col items-center justify-center">
              <FlashcardAnswer card={card} />
            </div>
            <Button
              variant="secondary"
              onClick={() => onReveal(false)}
              className="mt-3 min-w-36 shrink-0"
            >
              Show word
            </Button>
          </section>
        </div>
      </div>
    </Card>
  );
}
