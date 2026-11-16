import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ReviewHistoryEntry } from "@/components/reviews/ReviewHistoryEntry";
import type { DailyReviewGroup } from "@/lib/review-history-view";
import type { VocabularyReviewWithWord } from "@/lib/supabase/reviews";
import { getNextPage, getPreviousPage } from "@/lib/pagination";

function formatDay(day: string): string {
  const date = new Date(`${day}T12:00:00`);
  if (Number.isNaN(date.getTime())) return day;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "full" }).format(date);
}

export function ReviewHistoryDayPanel({
  selectedGroup,
  pageReviews,
  pageSize,
  firstVisible,
  lastVisible,
  currentPage,
  pageCount,
  onPageChange,
}: {
  selectedGroup: DailyReviewGroup | undefined;
  pageReviews: VocabularyReviewWithWord[];
  pageSize: number;
  firstVisible: number;
  lastVisible: number;
  currentPage: number;
  pageCount: number;
  onPageChange: (update: (page: number) => number) => void;
}) {
  if (!selectedGroup) {
    return (
      <Card className="px-5 py-10 text-center">
        <h2 className="font-semibold text-slate-900">No reviews on this date</h2>
        <p className="mt-2 text-sm text-slate-500">Choose another date with review activity to see its words and totals.</p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
        <div>
          <h2 className="font-semibold text-slate-900">Reviews on {formatDay(selectedGroup.day)}</h2>
          <p className="mt-1 text-sm text-slate-500">{selectedGroup.reviews.length} reviews · {selectedGroup.learning} Learning · {selectedGroup.mastered} Mastered</p>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {pageReviews.map((review) => <ReviewHistoryEntry key={review.id} review={review} />)}
      </div>
      {selectedGroup.reviews.length > pageSize && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-4 text-sm text-slate-500 sm:px-6">
          <span>Showing {firstVisible}–{lastVisible} of {selectedGroup.reviews.length} words</span>
          <div className="flex items-center gap-2">
            <span>Page {currentPage} of {pageCount}</span>
            <button type="button" aria-label="Previous review history page" disabled={currentPage <= 1} onClick={() => onPageChange((value) => getPreviousPage(value))} className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={18} /></button>
            <button type="button" aria-label="Next review history page" disabled={currentPage >= pageCount} onClick={() => onPageChange((value) => getNextPage(value, pageCount))} className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={18} /></button>
          </div>
        </div>
      )}
    </Card>
  );
}
