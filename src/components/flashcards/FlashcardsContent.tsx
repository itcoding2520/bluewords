"use client";

import Image from "next/image";
import { Star } from "lucide-react";

import { useVocabulary } from "@/contexts/VocabularyContext";
import { FlashcardStage } from "@/components/flashcards/FlashcardStage";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FlashcardFilters } from "@/components/flashcards/FlashcardFilters";
import { FlashcardNavigation } from "@/components/flashcards/FlashcardNavigation";
import { useFlashcardController } from "@/hooks/useFlashcardController";

export function FlashcardsContent() {
  const { words, categories, isLoaded, isAuthenticated, toggleMastered } = useVocabulary();
  const {
    category,
    status,
    index,
    isRevealed,
    setIsRevealed,
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
  } = useFlashcardController({ words, isAuthenticated, toggleMastered });

  if (!isLoaded) {
    return <p className="py-16 text-sm text-slate-500">Loading flashcards...</p>;
  }

  return (
    <div className="flashcards-page">
      <header className="flashcards-hero mb-4 sm:mb-5">
        <div className="flashcards-hero-copy"><p className="text-sm font-semibold text-blue-600">A little practice goes a long way</p><h1 className="page-title mt-1">Flashcards <Star className="inline size-6 fill-amber-400 text-amber-400" /></h1><p className="page-intro-description mt-2">Practice your vocabulary in a random order.</p></div>
        <Image src="/images/ui/illustrations/flashcards-apple-cat.svg" alt="" width={330} height={250} className="flashcards-hero-art" />
      </header>

      <FlashcardFilters
        words={words}
        categories={categories}
        category={category}
        onCategoryChange={changeCategory}
        isAuthenticated={isAuthenticated}
        status={status}
        statusCounts={statusCounts}
        onStatusChange={changeStatus}
        reviewMode={reviewMode}
        onReviewModeChange={changeReviewMode}
        isLoadingSchedules={isLoadingSchedules}
        areSchedulesLoaded={areSchedulesLoaded}
        dueCount={dueCount}
      />

      {card ? (
        <>
          <div className="flashcards-progress-row mb-3 flex flex-wrap items-center gap-3 text-sm">
            <span className="shrink-0 font-semibold text-indigo-950" aria-live="polite">Card {index + 1} of {deck.length}</span>
            <div className="flashcards-progress-track" role="progressbar" aria-label="Flashcard progress" aria-valuemin={0} aria-valuemax={deck.length} aria-valuenow={index + 1}><span style={{ width: `${deck.length ? ((index + 1) / deck.length) * 100 : 0}%` }} /></div>
            <span className="flashcards-encouragement hidden items-center gap-2 font-semibold text-indigo-900 sm:inline-flex"><Star size={19} className="fill-amber-400 text-amber-400" />Let’s go! You’re doing great!</span>
          </div>

          <FlashcardStage card={card} isRevealed={isRevealed} onReveal={setIsRevealed} />

          <FlashcardNavigation
            card={card}
            deckSize={deck.length}
            isAuthenticated={isAuthenticated}
            isTogglingStatus={isTogglingStatus}
            onPrevious={() => moveCard(-1)}
            onToggleStatus={() => void handleToggleStatus()}
            onNext={() => moveCard(1)}
          />
        </>
      ) : (
        <Card className="px-6 py-16 text-center">
          <h2 className="font-semibold text-slate-900">
            {reviewMode === "due"
              ? isLoadingSchedules
                ? "Loading due cards..."
                : scheduleLoadFailed
                  ? "Could not load review schedule"
                  : "You are all caught up"
              : "No flashcards yet"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {reviewMode === "due"
              ? scheduleLoadFailed
                ? "Check your connection and try loading the review schedule again."
                : isLoadingSchedules
                  ? "Checking for new and due words."
                  : "There are no new or due words in this category and status."
              : "Add vocabulary or choose a category with words to start studying."}
          </p>
          {reviewMode === "due" && scheduleLoadFailed && (
            <Button className="mt-4" variant="secondary" onClick={() => void loadReviewSchedules()}>
              Try again
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
