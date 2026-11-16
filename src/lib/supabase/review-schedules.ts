import { createClient } from "@/lib/supabase/client";
import { requireAuthenticatedUser } from "@/lib/supabase/authenticated-user";
import { invalidateLearningAnalyticsCache } from "@/lib/supabase/learning-analytics";
import type {
  VocabularyReviewRow,
  VocabularyReviewScheduleRow,
} from "@/types/database";
import { fetchAllPages } from "@/lib/supabase/fetch-all-pages.mjs";
import { invalidateLatestVocabularyReviewsCache } from "@/lib/supabase/review-history";

const supabase = createClient();
const schedulesByUser = new Map<string, VocabularyReviewScheduleRow[]>();

export function invalidateVocabularyReviewScheduleCache(userId?: string): void {
  if (userId) {
    schedulesByUser.delete(userId);
    return;
  }

  schedulesByUser.clear();
}

export async function getVocabularyReviewSchedules(): Promise<VocabularyReviewScheduleRow[]> {
  const user = await requireAuthenticatedUser(supabase, "You must be logged in to view review schedules.");

  const cachedSchedules = schedulesByUser.get(user.id);
  if (cachedSchedules) return cachedSchedules;

  const schedules = await fetchAllPages<VocabularyReviewScheduleRow>(async (from, to) => {
    const { data, error } = await supabase
      .from("vocabulary_review_schedule")
      .select("user_id, vocabulary_word_id, due_at, interval_days, repetitions, last_reviewed_at, updated_at")
      .eq("user_id", user.id)
      .order("due_at", { ascending: true })
      .order("vocabulary_word_id", { ascending: true })
      .range(from, to);

    return { data: (data ?? []) as VocabularyReviewScheduleRow[], error };
  });

  schedulesByUser.set(user.id, schedules);
  return schedules;
}

export async function recordVocabularyReview(
  vocabularyWordId: string,
  remembered: boolean
): Promise<{
  review: VocabularyReviewRow;
  schedule: VocabularyReviewScheduleRow;
}> {
  const user = await requireAuthenticatedUser(supabase, "You must be logged in to save a review.");

  const { data, error } = await supabase.rpc("record_vocabulary_review", {
    p_vocabulary_word_id: vocabularyWordId,
    p_remembered: remembered,
  });

  if (error) throw error;

  const result = data as unknown as {
    review: VocabularyReviewRow;
    schedule: VocabularyReviewScheduleRow;
  };

  invalidateLearningAnalyticsCache(user.id);
  invalidateLatestVocabularyReviewsCache();

  const cachedSchedules = schedulesByUser.get(user.id);
  if (cachedSchedules) {
    schedulesByUser.set(user.id, [
      result.schedule,
      ...cachedSchedules.filter((schedule) => schedule.vocabulary_word_id !== vocabularyWordId),
    ].sort((left, right) => left.due_at.localeCompare(right.due_at)));
  }

  return result;
}
