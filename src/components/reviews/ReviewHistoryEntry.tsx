"use client";

import Image from "next/image";
import { Check, Circle } from "lucide-react";
import { useVocabularyImageUrl } from "@/hooks/useVocabularyImageUrl";
import { formatLocalTime } from "@/lib/formatDate";
import type { VocabularyReviewWithWord } from "@/lib/supabase/review-history";

export function ReviewHistoryEntry({ review }: { review: VocabularyReviewWithWord }) {
  const word = review.vocabulary_words?.word ?? "Deleted vocabulary";

  return (
    <article className="review-result-row flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
      <ReviewWordImage word={word} imagePath={review.vocabulary_words?.image_path} />
      <div className="min-w-0 flex-1">
        <h3 className="break-words font-semibold text-slate-950">{word}</h3>
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
  );
}

function ReviewWordImage({ word, imagePath }: { word: string; imagePath?: string | null }) {
  const imageUrl = useVocabularyImageUrl(imagePath);
  if (!imageUrl) {
    return <span className="review-word-placeholder" aria-hidden="true">{word.slice(0, 1).toLocaleUpperCase()}</span>;
  }

  return <Image src={imageUrl} alt={`Image of ${word}`} width={72} height={72} unoptimized className="review-word-image" />;
}

function formatReviewedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  return formatLocalTime(date);
}
