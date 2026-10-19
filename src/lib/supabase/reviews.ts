import { createClient } from "@/lib/supabase/client";
import { invalidateLearningAnalyticsCache } from "@/lib/supabase/learning-analytics";
import type {
  VocabularyReviewRow,
  VocabularyReviewScheduleRow,
} from "@/types/database";
import { fetchAllPages } from "@/lib/supabase/fetch-all-pages.mjs";

const supabase = createClient();
const latestReviewsByUser = new Map<string, VocabularyReviewWithWord[]>();
const schedulesByUser = new Map<string, VocabularyReviewScheduleRow[]>();

export interface VocabularyReviewWithWord extends VocabularyReviewRow {
  vocabulary_words: {
    word: string;
    meaning: string;
    category: string;
  } | null;
}

export function getCachedLatestVocabularyReviews(
  userId: string
): VocabularyReviewWithWord[] | null {
  return latestReviewsByUser.get(userId) ?? null;
}

export function invalidateLatestVocabularyReviewsCache(): void {
  latestReviewsByUser.clear();
}

export function invalidateVocabularyReviewScheduleCache(userId?: string): void {
  if (userId) {
    schedulesByUser.delete(userId);
    return;
  }

  schedulesByUser.clear();
}

export async function getVocabularyReviewSchedules(): Promise<
  VocabularyReviewScheduleRow[]
> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be logged in to view review schedules.");
  }

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

export async function getLatestVocabularyReviews(): Promise<
  VocabularyReviewWithWord[]
> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be logged in to view review history.");
  }

  const cachedReviews = latestReviewsByUser.get(user.id);
  if (cachedReviews) return cachedReviews;

  const latestByWord = new Map<string, VocabularyReviewWithWord>();

  const allReviews = await fetchAllPages<VocabularyReviewWithWord>(async (from, to) => {
    const { data, error } = await supabase
      .from("vocabulary_reviews")
      .select("id, user_id, vocabulary_word_id, remembered, reviewed_at, vocabulary_words!inner(word, meaning, category)")
      .eq("user_id", user.id)
      .order("reviewed_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to);

    return {
      data: (data ?? []) as unknown as VocabularyReviewWithWord[],
      error,
    };
  });

  for (const review of allReviews) {
    if (!latestByWord.has(review.vocabulary_word_id)) {
      latestByWord.set(review.vocabulary_word_id, review);
    }
  }

  const reviews = [...latestByWord.values()];
  latestReviewsByUser.set(user.id, reviews);
  return reviews;
}

export async function recordVocabularyReview(
  vocabularyWordId: string,
  remembered: boolean,
  vocabularyWord?: VocabularyReviewWithWord["vocabulary_words"]
): Promise<{
  review: VocabularyReviewRow;
  schedule: VocabularyReviewScheduleRow;
}> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be logged in to save a review.");
  }

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

  const cachedReviews = latestReviewsByUser.get(user.id);
  if (cachedReviews) {
    const existingReview = cachedReviews.find(
      (review) => review.vocabulary_word_id === vocabularyWordId
    );
    const word = existingReview?.vocabulary_words ?? vocabularyWord;

    if (word) {
      latestReviewsByUser.set(user.id, [
        { ...result.review, vocabulary_words: word },
        ...cachedReviews.filter(
          (review) => review.vocabulary_word_id !== vocabularyWordId
        ),
      ]);
    } else {
      latestReviewsByUser.delete(user.id);
    }
  }

  const cachedSchedules = schedulesByUser.get(user.id);
  if (cachedSchedules) {
    schedulesByUser.set(user.id, [
      result.schedule,
      ...cachedSchedules.filter(
        (schedule) => schedule.vocabulary_word_id !== vocabularyWordId
      ),
    ].sort((left, right) => left.due_at.localeCompare(right.due_at)));
  }

  return result;
}
