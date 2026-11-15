import type { VocabularyReviewWithWord } from "@/lib/supabase/review-history-mapping";

export interface DailyReviewGroup {
  day: string;
  reviews: VocabularyReviewWithWord[];
  learning: number;
  mastered: number;
}

export function getLocalReviewDay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function groupReviewsByLocalDay(
  reviews: VocabularyReviewWithWord[]
): DailyReviewGroup[] {
  const groups = new Map<string, DailyReviewGroup>();
  for (const review of reviews) {
    const day = getLocalReviewDay(review.reviewed_at);
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
  return [...groups.values()].sort((left, right) =>
    right.day.localeCompare(left.day)
  );
}
