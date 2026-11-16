import type { LearningStatus } from "@/types/learning";

type LessonItem = { id: string };
type ReviewState = { status: LearningStatus; review_count: number; correct_count: number };
type ReviewStatus = { status: LearningStatus };

export function countMasteredLessonItems(items: readonly LessonItem[], reviews: Record<string, ReviewStatus>): number {
  let masteredCount = 0;
  for (const item of items) {
    if (reviews[item.id]?.status === "mastered") masteredCount += 1;
  }
  return masteredCount;
}

export function getNextLessonProgress(
  items: LessonItem[],
  reviews: Record<string, ReviewState>,
  itemId: string,
  nextReview: ReviewState,
) {
  const nextReviews = { ...reviews, [itemId]: nextReview };
  const masteredCount = countMasteredLessonItems(items, nextReviews);
  const completed = items.length > 0 && masteredCount === items.length;

  return { nextReviews, masteredCount, completed };
}
