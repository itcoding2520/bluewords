"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import type { SupabaseClient } from "@/lib/supabase/client";
import {
  upsertCommunicationItemReview,
  upsertCommunicationLessonProgress,
} from "@/lib/supabase/communication-review-mutations";
import { getCorrectReviewIntervalDays } from "@/lib/communication/lesson-practice";
import { getNextLessonProgress } from "@/lib/communication/lesson-progress";
import type { Item, ItemReview, Lesson } from "@/lib/communication/lesson-types";
import type { LearningStatus } from "@/types/learning";

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

  async function updateLessonProgress(itemId: string, review: ItemReview, now: string) {
    if (!userId) return null;

    const progress = getNextLessonProgress(items, reviews, itemId, review);
    setReviews(progress.nextReviews);

    const { error } = await upsertCommunicationLessonProgress(supabase, {
      user_id: userId,
      lesson_id: lessonId,
      status: progress.completed ? "completed" : "in_progress",
      completed_items: progress.masteredCount,
      completed_at: progress.completed ? now : null,
      updated_at: now,
    });
    return error;
  }

  async function setItemStatus(item: Item, status: LearningStatus) {
    if (!userId) { toast.error("Sign in to save your learning progress."); return; }
    setSaving(true);
    const existingReview = reviews[item.id];
    const now = new Date().toISOString();
    const { error } = await upsertCommunicationItemReview(supabase, {
      user_id: userId, item_id: item.id, status, review_count: existingReview?.review_count ?? 0,
      correct_count: existingReview?.correct_count ?? 0, last_reviewed_at: now,
      due_at: status === "mastered" ? new Date(Date.now() + 7 * 86400000).toISOString() : now, updated_at: now,
    });
    if (error) { toast.error(error.message); setSaving(false); return; }
    const review = {
      status,
      review_count: existingReview?.review_count ?? 0,
      correct_count: existingReview?.correct_count ?? 0,
    } satisfies ItemReview;
    const progressError = await updateLessonProgress(item.id, review, now);
    if (progressError) toast.error(progressError.message);
    else toast.success(status === "mastered" ? "Marked as mastered." : "Saved for more practice.");
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
    const { error } = await upsertCommunicationItemReview(supabase, {
      user_id: userId, item_id: item.id, status: nextStatus, review_count: nextReviewCount,
      correct_count: nextCorrectCount, last_reviewed_at: now, due_at: nextDueAt, updated_at: now,
    });
    if (error) {
      toast.error("Could not save this practice result.");
    } else {
      const review = {
        status: nextStatus,
        review_count: nextReviewCount,
        correct_count: nextCorrectCount,
      } satisfies ItemReview;
      const progressError = await updateLessonProgress(item.id, review, now);
      if (progressError) toast.error("Answer saved, but lesson progress could not be updated.");
      else toast(correct ? "Correct! This item is scheduled for review." : "Not quite. This item will come back for practice.");
    }
    setSaving(false);
  }

  return { saving, setItemStatus, recordPracticeOutcome };
}
