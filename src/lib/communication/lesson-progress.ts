type LessonItem = { id: string };
type ReviewState = { status: "learning" | "mastered"; review_count: number; correct_count: number };

export function getNextLessonProgress(
  items: LessonItem[],
  reviews: Record<string, ReviewState>,
  itemId: string,
  nextReview: ReviewState,
) {
  const nextReviews = { ...reviews, [itemId]: nextReview };
  const masteredCount = items.filter((item) => nextReviews[item.id]?.status === "mastered").length;
  const completed = items.length > 0 && masteredCount === items.length;

  return { nextReviews, masteredCount, completed };
}
