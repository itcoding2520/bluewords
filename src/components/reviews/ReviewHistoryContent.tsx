"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Circle, RotateCcw } from "lucide-react";

import { Card } from "@/components/ui/Card";
import {
  getCachedLatestVocabularyReviews,
  getLatestVocabularyReviews,
  type VocabularyReviewWithWord,
} from "@/lib/supabase/reviews";

type ReviewFilter = "practice" | "remembered";

function formatReviewedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function ReviewHistoryContent({ userId }: { userId: string }) {
  const [reviews, setReviews] = useState<VocabularyReviewWithWord[]>(
    () => getCachedLatestVocabularyReviews(userId) ?? []
  );
  const [filter, setFilter] = useState<ReviewFilter>("practice");
  const [isLoading, setIsLoading] = useState(
    () => getCachedLatestVocabularyReviews(userId) === null
  );
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (getCachedLatestVocabularyReviews(userId) !== null) {
      return () => {
        cancelled = true;
      };
    }

    void getLatestVocabularyReviews()
      .then((result) => {
        if (!cancelled) setReviews(result);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const counts = useMemo(
    () => ({
      practice: reviews.filter((review) => !review.remembered).length,
      remembered: reviews.filter((review) => review.remembered).length,
    }),
    [reviews]
  );

  const visibleReviews = reviews.filter((review) =>
    filter === "remembered" ? review.remembered : !review.remembered
  );

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <p className="text-sm font-medium text-blue-600">Daily learning</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">
          Review results
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Latest result for each word you have reviewed.
        </p>
      </header>

      <div className="mb-5 grid grid-cols-2 rounded-xl border border-slate-200 bg-white p-1">
        <button
          type="button"
          aria-pressed={filter === "practice"}
          onClick={() => setFilter("practice")}
          className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
            filter === "practice"
              ? "bg-amber-500 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <span>Need practice</span>
          <span className={`rounded-full px-2 py-0.5 text-xs ${filter === "practice" ? "bg-white/20" : "bg-amber-50 text-amber-700"}`}>
            {counts.practice}
          </span>
        </button>
        <button
          type="button"
          aria-pressed={filter === "remembered"}
          onClick={() => setFilter("remembered")}
          className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
            filter === "remembered"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <span>Remembered</span>
          <span className={`rounded-full px-2 py-0.5 text-xs ${filter === "remembered" ? "bg-white/20" : "bg-emerald-50 text-emerald-700"}`}>
            {counts.remembered}
          </span>
        </button>
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-slate-500">
          Loading review results...
        </p>
      ) : loadFailed ? (
        <Card className="px-5 py-10 text-center">
          <h2 className="font-semibold text-slate-900">
            Could not load review results
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Check that the vocabulary reviews migration has been applied, then refresh this page.
          </p>
        </Card>
      ) : visibleReviews.length === 0 ? (
        <Card className="px-5 py-12 text-center">
          <div className="mx-auto flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            {filter === "practice" ? <RotateCcw size={20} /> : <Check size={20} />}
          </div>
          <h2 className="mt-4 font-semibold text-slate-900">
            {reviews.length === 0
              ? "No review results yet"
              : filter === "practice"
                ? "No words need practice"
                : "No remembered words yet"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {reviews.length === 0
              ? "Open Flashcards, reveal a meaning, and save your result."
              : "Your latest result for each reviewed word appears here."}
          </p>
        </Card>
      ) : (
        <Card className="divide-y divide-slate-100 overflow-hidden p-0">
          {visibleReviews.map((review) => (
            <article
              key={review.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6"
            >
              <div className="min-w-0 flex-1">
                <h2 className="break-words font-semibold text-slate-950">
                  {review.vocabulary_words?.word ?? "Deleted vocabulary"}
                </h2>
                {review.vocabulary_words?.meaning && (
                  <p className="mt-1 break-words text-sm text-slate-500">
                    {review.vocabulary_words.meaning}
                  </p>
                )}
                {review.vocabulary_words?.category && (
                  <span className="mt-2 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                    {review.vocabulary_words.category}
                  </span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2 text-xs text-slate-500 sm:text-sm">
                {review.remembered ? (
                  <Check size={16} className="text-emerald-600" />
                ) : (
                  <Circle size={14} className="text-amber-600" />
                )}
                <time dateTime={review.reviewed_at}>
                  {formatReviewedAt(review.reviewed_at)}
                </time>
              </div>
            </article>
          ))}
        </Card>
      )}
    </div>
  );
}
