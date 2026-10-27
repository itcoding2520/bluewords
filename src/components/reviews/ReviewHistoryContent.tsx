"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Check, ChevronLeft, ChevronRight, Circle, RotateCcw, Star } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { useVocabularyImageUrl } from "@/hooks/useVocabularyImageUrl";
import {
  getCachedLatestVocabularyReviewHistory,
  getLatestVocabularyReviewHistory,
  type VocabularyReviewWithWord,
} from "@/lib/supabase/reviews";

const PAGE_SIZE = 20;

interface DailyReviewGroup {
  day: string;
  reviews: VocabularyReviewWithWord[];
  learning: number;
  mastered: number;
}

function getLocalDay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDay(day: string): string {
  const date = new Date(`${day}T12:00:00`);
  if (Number.isNaN(date.getTime())) return day;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "full",
  }).format(date);
}

function formatReviewedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  return new Intl.DateTimeFormat(undefined, {
    timeStyle: "short",
  }).format(date);
}

export function ReviewHistoryContent({ userId }: { userId: string }) {
  const initialReviews = getCachedLatestVocabularyReviewHistory(userId);
  const [reviews, setReviews] = useState<VocabularyReviewWithWord[]>(() => initialReviews ?? []);
  const [selectedDay, setSelectedDay] = useState(() =>
    initialReviews?.[0] ? getLocalDay(initialReviews[0].reviewed_at) : ""
  );
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(initialReviews === null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getLatestVocabularyReviewHistory(userId)
      .then((latestReviews) => {
        if (cancelled) return;
        setReviews(latestReviews);
        setSelectedDay((current) => {
          const availableDays = new Set(latestReviews.map((review) => getLocalDay(review.reviewed_at)));
          return current && availableDays.has(current)
            ? current
            : latestReviews[0]
              ? getLocalDay(latestReviews[0].reviewed_at)
              : "";
        });
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadFailed(true);
          setIsLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [userId]);

  const dailyGroups = useMemo(() => {
    const groups = new Map<string, DailyReviewGroup>();
    for (const review of reviews) {
      const day = getLocalDay(review.reviewed_at);
      if (!day) continue;
      let group = groups.get(day);
      if (!group) {
        group = { day, reviews: [], learning: 0, mastered: 0 };
        groups.set(day, group);
      }
      group.reviews.push(review);
      if (review.vocabulary_words?.status === "mastered") group.mastered += 1;
      else group.learning += 1;
    }
    return [...groups.values()].sort((left, right) => right.day.localeCompare(left.day));
  }, [reviews]);

  const selectedGroup = dailyGroups.find((group) => group.day === selectedDay);
  const earliestDay = dailyGroups[dailyGroups.length - 1]?.day;
  const latestDay = dailyGroups[0]?.day;
  const pageCount = Math.max(1, Math.ceil((selectedGroup?.reviews.length ?? 0) / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageReviews = selectedGroup?.reviews.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE) ?? [];
  const firstVisible = pageReviews.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastVisible = Math.min(currentPage * PAGE_SIZE, selectedGroup?.reviews.length ?? 0);

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
                {pageReviews.map((review) => (
                  <article
                    key={review.id}
                    className="review-result-row flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6"
                  >
                    <ReviewWordImage
                      word={review.vocabulary_words?.word ?? "Deleted vocabulary"}
                      imagePath={review.vocabulary_words?.image_path}
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words font-semibold text-slate-950">
                        {review.vocabulary_words?.word ?? "Deleted vocabulary"}
                      </h3>
                      {review.vocabulary_words?.meaning && (
                        <p className="mt-1 break-words text-sm text-slate-500">{review.vocabulary_words.meaning}</p>
                      )}
                      {review.vocabulary_words?.category && (
                        <span className="mt-2 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                          {review.vocabulary_words.category}
                        </span>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-xs text-slate-500 sm:text-sm">
                      {review.vocabulary_words?.status === "mastered" ? (
                        <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700"><Check size={15} /> Mastered</span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-medium text-amber-700"><Circle size={13} /> Learning</span>
                      )}
                      <time dateTime={review.reviewed_at}>{formatReviewedAt(review.reviewed_at)}</time>
                    </div>
                  </article>
                ))}
              </div>
              {selectedGroup.reviews.length > PAGE_SIZE && (
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

function ReviewWordImage({ word, imagePath }: { word: string; imagePath?: string | null }) {
  const imageUrl = useVocabularyImageUrl(imagePath);
  if (!imageUrl) {
    return <span className="review-word-placeholder" aria-hidden="true">{word.slice(0, 1).toLocaleUpperCase()}</span>;
  }

  return <Image src={imageUrl} alt={`Image of ${word}`} width={72} height={72} unoptimized className="review-word-image" />;
}
