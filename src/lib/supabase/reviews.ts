import { createClient } from "@/lib/supabase/client";
import { invalidateLearningAnalyticsCache } from "@/lib/supabase/learning-analytics";
import type {
  VocabularyReviewRow,
  VocabularyReviewScheduleRow,
} from "@/types/database";
import type { VocabularyStatus } from "@/data/vocabulary";
import { fetchAllPages } from "@/lib/supabase/fetch-all-pages.mjs";
import { getVocabularyWordImagePaths } from "@/lib/supabase/vocabulary";

const supabase = createClient();
const latestReviewsByPage = new Map<string, LatestVocabularyReviewsPage>();
const latestReviewCountsByUser = new Map<string, LatestVocabularyReviewCounts>();
const latestReviewHistoryByUser = new Map<string, VocabularyReviewWithWord[]>();
const schedulesByUser = new Map<string, VocabularyReviewScheduleRow[]>();

const REVIEW_HISTORY_PAGE_SIZE = 20;

export interface VocabularyReviewWithWord extends VocabularyReviewRow {
  vocabulary_words: {
    word: string;
    meaning: string;
    category: string;
    image_path: string | null;
    status: VocabularyStatus;
  } | null;
}

export interface LatestVocabularyReviewsPage {
  reviews: VocabularyReviewWithWord[];
  total: number;
}

export interface LatestVocabularyReviewCounts {
  learning: number;
  mastered: number;
}

function reviewPageCacheKey(
  userId: string,
  status: VocabularyStatus,
  page: number,
  pageSize: number
): string {
  return `${userId}:${status}:${page}:${pageSize}`;
}

export function getCachedLatestVocabularyReviews(
  userId: string,
  status: VocabularyStatus,
  page = 1,
  pageSize = REVIEW_HISTORY_PAGE_SIZE
): LatestVocabularyReviewsPage | null {
  return latestReviewsByPage.get(
    reviewPageCacheKey(userId, status, page, pageSize)
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
  latestReviewHistoryByUser.clear();
}

interface LatestReviewRpcRow {
  id: string;
  user_id: string;
  vocabulary_word_id: string;
  remembered: boolean;
  reviewed_at: string;
  word: string;
  meaning: string;
  category: string;
  status: VocabularyStatus;
}

async function mapLatestReviewRows(
  rows: LatestReviewRpcRow[]
): Promise<VocabularyReviewWithWord[]> {
  let imagePathByWordId = new Map<string, string | null>();
  const wordIds = [...new Set(rows.map((review) => review.vocabulary_word_id))];
  try {
    const imageRows = [];
    for (let start = 0; start < wordIds.length; start += 100) {
      imageRows.push(...await getVocabularyWordImagePaths(wordIds.slice(start, start + 100)));
    }
    imagePathByWordId = new Map(imageRows.map((row) => [row.id, row.image_path]));
  } catch {
    // Keep review history available if image metadata cannot be loaded.
  }

  return rows.map((review) => ({
    id: review.id,
    user_id: review.user_id,
    vocabulary_word_id: review.vocabulary_word_id,
    remembered: review.remembered,
    reviewed_at: review.reviewed_at,
    vocabulary_words: {
      word: review.word,
      meaning: review.meaning,
      category: review.category,
      image_path: imagePathByWordId.get(review.vocabulary_word_id) ?? null,
      status: review.status,
    },
  }));
}

export function getCachedLatestVocabularyReviewHistory(
  userId: string
): VocabularyReviewWithWord[] | null {
  return latestReviewHistoryByUser.get(userId) ?? null;
}

export async function getLatestVocabularyReviewHistory(
  expectedUserId: string
): Promise<VocabularyReviewWithWord[]> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user || user.id !== expectedUserId) {
    throw new Error("You must be logged in to view review history.");
  }

  const cached = latestReviewHistoryByUser.get(user.id);
  if (cached) return cached;

  const rows = await fetchAllPages<LatestReviewRpcRow>(async (from, to) => {
    const { data, error } = await supabase
      .rpc("get_vocabulary_review_history")
      .order("reviewed_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to);
    return { data: (data ?? []) as LatestReviewRpcRow[], error };
  });
  const reviews = await mapLatestReviewRows(rows);
  latestReviewHistoryByUser.set(user.id, reviews);
  return reviews;
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
  status: VocabularyStatus;
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
    input.status,
    input.page,
    pageSize
  );
  const cachedPage = latestReviewsByPage.get(cacheKey);
  if (cachedPage) return cachedPage;

  const from = (input.page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .rpc("get_latest_vocabulary_reviews", {}, { count: "exact" })
    .eq("status", input.status)
    .order("reviewed_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);

  if (error) throw error;

  const mappedReviews = await mapLatestReviewRows((data ?? []) as LatestReviewRpcRow[]);
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

  const counts: LatestVocabularyReviewCounts = { learning: 0, mastered: 0 };
  for (const row of data ?? []) {
    if (row.status === "mastered") counts.mastered = Number(row.review_count);
    else if (row.status === "learning") counts.learning = Number(row.review_count);
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
