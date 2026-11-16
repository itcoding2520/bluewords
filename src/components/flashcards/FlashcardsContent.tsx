"use client";

import Image from "next/image";
import { Star } from "lucide-react";

import { useVocabulary } from "@/contexts/VocabularyContext";
import { FlashcardStage } from "@/components/flashcards/FlashcardStage";
import { FlashcardFilters } from "@/components/flashcards/FlashcardFilters";
import { FlashcardEmptyState } from "@/components/flashcards/FlashcardEmptyState";
import { FlashcardNavigation } from "@/components/flashcards/FlashcardNavigation";
import { useFlashcardController } from "@/hooks/useFlashcardController";

export function FlashcardsContent() {
  const { words, categories, isLoaded, isAuthenticated, toggleMastered } = useVocabulary();
  const { filters, schedules, deck, card } = useFlashcardController({ words, isAuthenticated, toggleMastered });

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
        category={filters.category}
        onCategoryChange={filters.changeCategory}
        isAuthenticated={isAuthenticated}
        status={filters.status}
        statusCounts={filters.statusCounts}
        onStatusChange={filters.changeStatus}
        reviewMode={filters.reviewMode}
        onReviewModeChange={filters.changeReviewMode}
        isLoadingSchedules={schedules.isLoading}
        areSchedulesLoaded={schedules.areLoaded}
        dueCount={filters.dueCount}
      />

      {deck.currentCard ? (
        <>
          <div className="flashcards-progress-row mb-3 flex flex-wrap items-center gap-3 text-sm">
            <span className="shrink-0 font-semibold text-indigo-950" aria-live="polite">Card {deck.index + 1} of {deck.cards.length}</span>
            <div className="flashcards-progress-track" role="progressbar" aria-label="Flashcard progress" aria-valuemin={0} aria-valuemax={deck.cards.length} aria-valuenow={deck.index + 1}><span style={{ width: `${deck.cards.length ? ((deck.index + 1) / deck.cards.length) * 100 : 0}%` }} /></div>
            <span className="flashcards-encouragement hidden items-center gap-2 font-semibold text-indigo-900 sm:inline-flex"><Star size={19} className="fill-amber-400 text-amber-400" />Let’s go! You’re doing great!</span>
          </div>

          <FlashcardStage card={deck.currentCard} isRevealed={card.isRevealed} onReveal={card.setIsRevealed} />

          <FlashcardNavigation
            card={deck.currentCard}
            deckSize={deck.cards.length}
            isAuthenticated={isAuthenticated}
            isTogglingStatus={card.isTogglingStatus}
            onPrevious={() => deck.moveCard(-1)}
            onToggleStatus={() => void card.toggleStatus()}
            onNext={() => deck.moveCard(1)}
          />
        </>
      ) : (
        <FlashcardEmptyState
          reviewMode={filters.reviewMode}
          isLoadingSchedules={schedules.isLoading}
          scheduleLoadFailed={schedules.loadFailed}
          onRetry={() => void schedules.load()}
        />
      )}
    </div>
  );
}
