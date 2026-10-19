import { createClient } from "@/lib/supabase/client";
import { invalidateLearningAnalyticsCache } from "@/lib/supabase/learning-analytics";
import type {
  VocabularyReviewRow,
  VocabularyReviewScheduleRow,
} from "@/types/database";
import { fetchAllPages } from "@/lib/supabase/fetch-all-pages.mjs";

const supabase = createClient();
const latestReviewsByPage = new Map<string, LatestVocabularyReviewsPage>();
const latestReviewCountsByUser = new Map<string, LatestVocabularyReviewCounts>();
const schedulesByUser = new Map<string, VocabularyReviewScheduleRow[]>();

const REVIEW_HISTORY_PAGE_SIZE = 20;

export interface VocabularyReviewWithWord extends VocabularyReviewRow {
  vocabulary_words: {
    word: string;
    meaning: string;
    category: string;
  } | null;
}

export interface LatestVocabularyReviewsPage {
  reviews: VocabularyReviewWithWord[];
  total: number;
}

export interface LatestVocabularyReviewCounts {
  practice: number;
  remembered: number;
}

function reviewPageCacheKey(
  userId: string,
  remembered: boolean,
  page: number,
  pageSize: number
): string {
  return `${userId}:${remembered ? "remembered" : "practice"}:${page}:${pageSize}`;
}

export function getCachedLatestVocabularyReviews(
  userId: string,
  remembered: boolean,
  page = 1,
  pageSize = REVIEW_HISTORY_PAGE_SIZE
): LatestVocabularyReviewsPage | null {
  return latestReviewsByPage.get(
    reviewPageCacheKey(userId, remembered, page, pageSize)
  ) ?? null;
}

export function getCachedLatestVocabularyReviewCounts(
  userId: string
): LatestVocabularyReviewCounts | null {
  return latestReviewCountsByUser.get(userId) ?? null;
}

export function invalidateLatestVocabularyReviewsCache(): void {
  latestReviewsByPage.clear();
  latestReviewCountsByUser.clear();
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

export async function getLatestVocabularyReviews(input: {
  remembered: boolean;
  page: number;
  pageSize?: number;
}): Promise<LatestVocabularyReviewsPage> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be logged in to view review history.");
  }

  const pageSize = input.pageSize ?? REVIEW_HISTORY_PAGE_SIZE;
  if (!Number.isInteger(input.page) || input.page < 1) {
    throw new RangeError("Review history page must be a positive integer.");
  }
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new RangeError("Review history page size must be a positive integer.");
  }

  const cacheKey = reviewPageCacheKey(
    user.id,
    input.remembered,
    input.page,
    pageSize
  );
  const cachedPage = latestReviewsByPage.get(cacheKey);
  if (cachedPage) return cachedPage;

  const from = (input.page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .rpc("get_latest_vocabulary_reviews", {}, { count: "exact" })
    .eq("remembered", input.remembered)
    .order("reviewed_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);

  if (error) throw error;

  const reviews = (data ?? []) as Array<{
    id: string;
    user_id: string;
    vocabulary_word_id: string;
    remembered: boolean;
    reviewed_at: string;
    word: string;
    meaning: string;
    category: string;
  }>;

  const mappedReviews: VocabularyReviewWithWord[] = reviews.map((review) => ({
    id: review.id,
    user_id: review.user_id,
    vocabulary_word_id: review.vocabulary_word_id,
    remembered: review.remembered,
    reviewed_at: review.reviewed_at,
    vocabulary_words: {
      word: review.word,
      meaning: review.meaning,
      category: review.category,
    },
  }));
  const result = { reviews: mappedReviews, total: count ?? 0 };
  latestReviewsByPage.set(cacheKey, result);
  return result;
}

export async function getLatestVocabularyReviewCounts(): Promise<LatestVocabularyReviewCounts> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be logged in to view review history.");
  }

  const cachedCounts = latestReviewCountsByUser.get(user.id);
  if (cachedCounts) return cachedCounts;

  const { data, error } = await supabase.rpc(
    "get_latest_vocabulary_review_counts"
  );

  if (error) throw error;

  const counts: LatestVocabularyReviewCounts = { practice: 0, remembered: 0 };
  for (const row of data ?? []) {
    if (row.remembered) counts.remembered = Number(row.review_count);
    else counts.practice = Number(row.review_count);
  }

  latestReviewCountsByUser.set(user.id, counts);
  return counts;
}

export async function recordVocabularyReview(
  vocabularyWordId: string,
  remembered: boolean
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

  invalidateLatestVocabularyReviewsCache();

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
