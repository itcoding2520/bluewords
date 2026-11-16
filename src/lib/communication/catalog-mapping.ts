import type { LessonAccuracy, ReviewItem } from "@/lib/communication/catalog-types";
import { firstRelation } from "@/lib/supabase/first-relation";

export type CommunicationReviewAccuracyRow = {
  review_count: number;
  correct_count: number;
  communication_lesson_items: { lesson_id: string } | { lesson_id: string }[];
};

type DueReview = { item_id: string; due_at: string };
type DueItemSource = { id: string; lesson_id: string; content_en: string; meaning_vi: string };
type DueLesson = { id: string; title_en: string; title_vi: string };

export function mapCommunicationLessonAccuracy(rows: CommunicationReviewAccuracyRow[]): LessonAccuracy {
  const lessonAccuracy: LessonAccuracy = {};
  for (const row of rows) {
    const item = firstRelation(row.communication_lesson_items);
    if (!item) continue;
    const stats = lessonAccuracy[item.lesson_id] ?? { correct: 0, attempts: 0 };
    stats.correct += row.correct_count;
    stats.attempts += row.review_count;
    lessonAccuracy[item.lesson_id] = stats;
  }
  return lessonAccuracy;
}

export function mapDueCommunicationReviews(
  items: DueItemSource[],
  lessons: DueLesson[],
  reviews: DueReview[],
): ReviewItem[] {
  const lessonsById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const dueAtById = new Map(reviews.map((review) => [review.item_id, review.due_at]));
  return items.flatMap((item) => {
    const lesson = lessonsById.get(item.lesson_id);
    return lesson ? [{
      item_id: item.id,
      due_at: dueAtById.get(item.id) ?? "",
      content_en: item.content_en,
      meaning_vi: item.meaning_vi,
      lesson_id: item.lesson_id,
      lesson_title_en: lesson.title_en,
      lesson_title_vi: lesson.title_vi,
    }] : [];
  });
}
