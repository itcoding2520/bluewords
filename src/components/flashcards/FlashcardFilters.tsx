import Image from "next/image";
import { CalendarClock, Star } from "lucide-react";
import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { CategoryDropdown } from "@/components/vocabulary/VocabularyCategoryDropdown";

type VocabularyStatus = "learning" | "mastered";
type ReviewMode = "all" | "due";

interface FlashcardFiltersProps {
  words: VocabularyWord[];
  categories: VocabularyCategoryRow[];
  category: string;
  onCategoryChange: (category: string) => void;
  isAuthenticated: boolean;
  status: VocabularyStatus;
  statusCounts: Record<VocabularyStatus, number>;
  onStatusChange: (status: VocabularyStatus) => void;
  reviewMode: ReviewMode;
  onReviewModeChange: (mode: ReviewMode) => void;
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
  return (
    <>
      <div className={`flashcards-filters mb-4 grid gap-3 ${isAuthenticated ? "sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : ""}`}>
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

        {isAuthenticated && <fieldset>
          <legend className="mb-2 text-sm font-semibold text-indigo-950">
            Vocabulary status
          </legend>
          <div className="flashcards-status-switch grid grid-cols-2 rounded-2xl border border-slate-200 bg-white p-1">
            <button
              type="button"
              aria-pressed={status === "learning"}
              onClick={() => onStatusChange("learning")}
              className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${status === "learning" ? "bg-amber-500 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <span className="inline-flex items-center gap-1.5"><Star size={15} fill="currentColor" />Learning</span>
              <span className={`rounded-full px-2 py-0.5 text-xs ${status === "learning" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                {statusCounts.learning}
              </span>
            </button>
            <button
              type="button"
              aria-pressed={status === "mastered"}
              onClick={() => onStatusChange("mastered")}
              className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${status === "mastered" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <span className="inline-flex items-center gap-1.5"><Star size={15} />Mastered</span>
              <span className={`rounded-full px-2 py-0.5 text-xs ${status === "mastered" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                {statusCounts.mastered}
              </span>
            </button>
          </div>
        </fieldset>}
      </div>

      {isAuthenticated && (
        <div className="flashcards-mode mb-4 flex flex-wrap items-center gap-2" role="group" aria-label="Flashcard review mode">
          <button
            type="button"
            aria-pressed={reviewMode === "all"}
            onClick={() => onReviewModeChange("all")}
            className={`flashcards-mode-button inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${reviewMode === "all" ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            <Image src="/images/ui/icons/flashcards.svg" alt="" width={17} height={17} /> All cards
          </button>
          <button
            type="button"
            aria-pressed={reviewMode === "due"}
            disabled={isLoadingSchedules}
            onClick={() => onReviewModeChange("due")}
            className={`flashcards-mode-button inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-50 ${reviewMode === "due" ? "border-amber-500 bg-amber-500 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
          >
            <CalendarClock size={16} /> Due now
            <span className={`rounded-full px-2 py-0.5 text-xs ${reviewMode === "due" ? "bg-white/20" : "bg-amber-50 text-amber-700"}`}>
              {areSchedulesLoaded ? dueCount : isLoadingSchedules ? "…" : "—"}
            </span>
          </button>
          {reviewMode === "due" && (
            <span className="text-xs text-slate-500">
              Includes new words and reviews that have reached their due date.
            </span>
          )}
        </div>
      )}
    </>
  );
}
