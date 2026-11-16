import Image from "next/image";
import { CalendarClock } from "lucide-react";
import type { FlashcardReviewMode } from "@/types/flashcards";

export function FlashcardReviewModeFilter({
  reviewMode,
  onReviewModeChange,
  isLoadingSchedules,
  areSchedulesLoaded,
  dueCount,
}: {
  reviewMode: FlashcardReviewMode;
  onReviewModeChange: (mode: FlashcardReviewMode) => void;
  isLoadingSchedules: boolean;
  areSchedulesLoaded: boolean;
  dueCount: number;
}) {
  return (
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
  );
}
