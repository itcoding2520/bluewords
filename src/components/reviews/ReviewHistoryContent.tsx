"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, RotateCcw, Star } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { useReviewHistoryController } from "@/hooks/useReviewHistoryController";
import { ReviewHistoryEntry } from "@/components/reviews/ReviewHistoryEntry";

function formatDay(day: string): string {
  const date = new Date(`${day}T12:00:00`);
  if (Number.isNaN(date.getTime())) return day;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "full",
  }).format(date);
}

export function ReviewHistoryContent({ userId }: { userId: string }) {
  const {
    isLoading,
    loadFailed,
    dailyGroups,
    selectedGroup,
    selectedDay,
    setSelectedDay,
    setPage,
    earliestDay,
    latestDay,
    pageReviews,
    firstVisible,
    lastVisible,
    pageCount,
    currentPage,
    pageSize,
  } = useReviewHistoryController(userId);

  return (
    <div className="review-results-page mx-auto max-w-5xl">
      <header className="review-results-hero mb-6">
        <p className="text-sm font-medium text-blue-600">Daily learning</p>
        <h1 className="page-title mt-1">
          Review results <Star aria-hidden="true" className="inline size-6 fill-amber-400 text-amber-400" />
        </h1>
        <p className="page-intro-description mt-2">
          Track each day’s reviews by Learning and Mastered words.
        </p>
      </header>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-slate-500">Loading daily review history...</p>
      ) : loadFailed ? (
        <Card className="px-5 py-10 text-center">
          <h2 className="font-semibold text-slate-900">Could not load review results</h2>
          <p className="mt-2 text-sm text-slate-500">
            Check that the vocabulary reviews migration has been applied, then refresh this page.
          </p>
        </Card>
      ) : dailyGroups.length === 0 ? (
        <Card className="review-empty-state px-5 py-12 text-center">
          <Image src="/images/ui/illustrations/hero-book-mascot.svg" alt="" width={420} height={300} className="review-empty-art" />
          <h2 className="mt-4 font-semibold text-slate-900">No review history yet</h2>
          <p className="mt-2 text-sm text-slate-500">Review flashcards to see your daily Learning and Mastered totals here.</p>
          <Link href="/flashcards" className="review-empty-cta"><RotateCcw size={19} /> Practice flashcards <ArrowRight size={20} /></Link>
        </Card>
      ) : (
        <>
          <section aria-label="Choose review date" className="mb-5">
            <label htmlFor="review-history-date" className="mb-2 block text-sm font-semibold text-slate-700">
              Choose a review date
            </label>
            <div className="relative max-w-sm">
              <CalendarDays size={17} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-600" />
              <input
                id="review-history-date"
                type="date"
                value={selectedDay}
                min={earliestDay}
                max={latestDay}
                onChange={(event) => { setSelectedDay(event.target.value); setPage(1); }}
                className="h-12 w-full rounded-xl border border-blue-100 bg-white pl-10 pr-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">Select a date to view its Learning and Mastered review totals.</p>
          </section>

          {selectedGroup ? (
            <Card className="overflow-hidden p-0">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
                <div>
                  <h2 className="font-semibold text-slate-900">Reviews on {formatDay(selectedGroup.day)}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedGroup.reviews.length} reviews · {selectedGroup.learning} Learning · {selectedGroup.mastered} Mastered
                  </p>
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
                    <button type="button" aria-label="Previous review history page" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={18} /></button>
                    <button type="button" aria-label="Next review history page" disabled={currentPage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={18} /></button>
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card className="px-5 py-10 text-center">
              <h2 className="font-semibold text-slate-900">No reviews on this date</h2>
              <p className="mt-2 text-sm text-slate-500">Choose another date with review activity to see its words and totals.</p>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
