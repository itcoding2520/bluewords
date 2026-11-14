"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import type { createClient } from "@/lib/supabase/client";
import { invalidateCommunicationCatalogCache } from "@/lib/supabase/communication-catalog-cache";
import { getCorrectReviewIntervalDays } from "@/lib/communication/lesson-practice";
import { getNextLessonProgress } from "@/lib/communication/lesson-progress";
import type { Item, ItemReview, Lesson } from "@/lib/communication/lesson-types";

type SupabaseClient = ReturnType<typeof createClient>;
type Props = {
  supabase: SupabaseClient;
  lessonId: string;
  lesson: Lesson | null;
  items: Item[];
  reviews: Record<string, ItemReview>;
  setReviews: Dispatch<SetStateAction<Record<string, ItemReview>>>;
  userId: string | null;
};

export function useCommunicationLessonReviewActions({ supabase, lessonId, lesson, items, reviews, setReviews, userId }: Props) {
  const [saving, setSaving] = useState(false);

  async function setItemStatus(item: Item, status: "learning" | "mastered") {
    if (!userId) { toast.error("Sign in to save your learning progress."); return; }
    setSaving(true);
    const existingReview = reviews[item.id];
    const now = new Date().toISOString();
    const { error } = await supabase.from("communication_item_reviews").upsert({
      user_id: userId, item_id: item.id, status, review_count: existingReview?.review_count ?? 0,
      correct_count: existingReview?.correct_count ?? 0, last_reviewed_at: now,
      due_at: status === "mastered" ? new Date(Date.now() + 7 * 86400000).toISOString() : now, updated_at: now,
    }, { onConflict: "user_id,item_id" });
    if (error) { toast.error(error.message); setSaving(false); return; }
    const { nextReviews, masteredCount, completed } = getNextLessonProgress(items, reviews, item.id, {
      status,
      review_count: existingReview?.review_count ?? 0,
      correct_count: existingReview?.correct_count ?? 0,
    });
    setReviews(nextReviews);
    const { error: progressError } = await supabase.from("communication_lesson_progress").upsert({ user_id: userId, lesson_id: lessonId, status: completed ? "completed" : "in_progress", completed_items: masteredCount, completed_at: completed ? now : null, updated_at: now }, { onConflict: "user_id,lesson_id" });
    if (progressError) toast.error(progressError.message);
    else { invalidateCommunicationCatalogCache(userId); toast.success(status === "mastered" ? "Marked as mastered." : "Saved for more practice."); }
    setSaving(false);
  }

  async function recordPracticeOutcome(item: Item, correct: boolean) {
    if (!userId) return;
    setSaving(true);
    const existingReview = reviews[item.id];
    const nextReviewCount = (existingReview?.review_count ?? 0) + 1;
    const nextCorrectCount = (existingReview?.correct_count ?? 0) + (correct ? 1 : 0);
    const nextStatus: ItemReview["status"] = correct && nextCorrectCount >= 2 ? "mastered" : existingReview?.status === "mastered" && correct ? "mastered" : "learning";
    const reviewedAt = new Date();
    const now = reviewedAt.toISOString();
    const nextDueAt = correct
      ? new Date(reviewedAt.getTime() + getCorrectReviewIntervalDays(nextReviewCount, nextCorrectCount, lesson?.difficulty ?? "medium") * 86400000).toISOString()
      : new Date(reviewedAt.getTime() + 15 * 60000).toISOString();
    const { error } = await supabase.from("communication_item_reviews").upsert({
      user_id: userId, item_id: item.id, status: nextStatus, review_count: nextReviewCount,
      correct_count: nextCorrectCount, last_reviewed_at: now, due_at: nextDueAt, updated_at: now,
    }, { onConflict: "user_id,item_id" });
    if (error) {
      toast.error("Could not save this practice result.");
    } else {
      const { nextReviews, masteredCount, completed } = getNextLessonProgress(items, reviews, item.id, {
        status: nextStatus,
        review_count: nextReviewCount,
        correct_count: nextCorrectCount,
      });
      setReviews(nextReviews);
      const { error: progressError } = await supabase.from("communication_lesson_progress").upsert({
        user_id: userId, lesson_id: lessonId, status: completed ? "completed" : "in_progress",
        completed_items: masteredCount, completed_at: completed ? now : null, updated_at: now,
      }, { onConflict: "user_id,lesson_id" });
      if (progressError) toast.error("Answer saved, but lesson progress could not be updated.");
      else { invalidateCommunicationCatalogCache(userId); toast(correct ? "Correct! This item is scheduled for review." : "Not quite. This item will come back for practice."); }
    }
    setSaving(false);
  }

  return { saving, setItemStatus, recordPracticeOutcome };
}
