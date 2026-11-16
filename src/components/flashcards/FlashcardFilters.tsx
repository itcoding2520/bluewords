import type { VocabularyStatus, VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { CategoryDropdown } from "@/components/vocabulary/VocabularyCategoryDropdown";
import { FlashcardStatusFilter } from "@/components/flashcards/FlashcardStatusFilter";
import { FlashcardReviewModeFilter } from "@/components/flashcards/FlashcardReviewModeFilter";
import type { FlashcardReviewMode } from "@/types/flashcards";

interface FlashcardFiltersProps {
  words: VocabularyWord[];
  categories: VocabularyCategoryRow[];
  category: string;
  onCategoryChange: (category: string) => void;
  isAuthenticated: boolean;
  status: VocabularyStatus;
  statusCounts: Record<VocabularyStatus, number>;
  onStatusChange: (status: VocabularyStatus) => void;
  reviewMode: FlashcardReviewMode;
  onReviewModeChange: (mode: FlashcardReviewMode) => void;
  isLoadingSchedules: boolean;
  areSchedulesLoaded: boolean;
  dueCount: number;
}

export function FlashcardFilters({
  words,
  categories,
  category,
  onCategoryChange,
  isAuthenticated,
  status,
  statusCounts,
  onStatusChange,
  reviewMode,
  onReviewModeChange,
  isLoadingSchedules,
  areSchedulesLoaded,
  dueCount,
}: FlashcardFiltersProps) {
  const filtersClassName = [
    "flashcards-filters mb-4 grid gap-3",
    isAuthenticated ? "sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : "",
  ].filter(Boolean).join(" ");

  return (
    <>
      <div className={filtersClassName}>
        <div>
          <p className="mb-2 text-sm font-semibold text-indigo-950">Category</p>
          <CategoryDropdown
            category={category}
            categories={categories}
            words={words}
            includeAll
            fullWidth
            onChange={onCategoryChange}
          />
        </div>

        {isAuthenticated && (
          <FlashcardStatusFilter
            status={status}
            statusCounts={statusCounts}
            onStatusChange={onStatusChange}
          />
        )}
      </div>

      {isAuthenticated && (
        <FlashcardReviewModeFilter
          reviewMode={reviewMode}
          onReviewModeChange={onReviewModeChange}
          isLoadingSchedules={isLoadingSchedules}
          areSchedulesLoaded={areSchedulesLoaded}
          dueCount={dueCount}
        />
      )}
    </>
  );
}
