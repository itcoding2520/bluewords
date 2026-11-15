import { createClient } from "@/lib/supabase/client";
import type { VocabularyStatus } from "@/data/vocabulary";
import { fetchAllPages } from "@/lib/supabase/fetch-all-pages.mjs";
import { requireAuthenticatedUser } from "@/lib/supabase/authenticated-user";
import { mapLatestReviewRows, type LatestReviewRpcRow, type VocabularyReviewWithWord } from "@/lib/supabase/review-history-mapping";
export type { VocabularyReviewWithWord } from "@/lib/supabase/review-history-mapping";

const supabase = createClient();
const latestReviewsByPage = new Map<string, LatestVocabularyReviewsPage>();
const latestReviewCountsByUser = new Map<string, LatestVocabularyReviewCounts>();
const latestReviewHistoryByUser = new Map<string, VocabularyReviewWithWord[]>();

const REVIEW_HISTORY_PAGE_SIZE = 20;

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

export function getCachedLatestVocabularyReviewHistory(
  userId: string
): VocabularyReviewWithWord[] | null {
  return latestReviewHistoryByUser.get(userId) ?? null;
}

export async function getLatestVocabularyReviewHistory(
  expectedUserId: string
): Promise<VocabularyReviewWithWord[]> {
  const errorMessage = "You must be logged in to view review history.";
  const user = await requireAuthenticatedUser(supabase, errorMessage);
  if (user.id !== expectedUserId) throw new Error(errorMessage);

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

export async function getLatestVocabularyReviews(input: {
  status: VocabularyStatus;
  page: number;
  pageSize?: number;
}): Promise<LatestVocabularyReviewsPage> {
  const user = await requireAuthenticatedUser(supabase, "You must be logged in to view review history.");

  const pageSize = input.pageSize ?? REVIEW_HISTORY_PAGE_SIZE;
  if (!Number.isInteger(input.page) || input.page < 1) {
    throw new RangeError("Review history page must be a positive integer.");
  }
  if (!Number.isInteger(pageSize) || pageSize < 1) {
    throw new RangeError("Review history page size must be a positive integer.");
  }

  const cacheKey = reviewPageCacheKey(user.id, input.status, input.page, pageSize);
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
  const user = await requireAuthenticatedUser(supabase, "You must be logged in to view review history.");

  const cachedCounts = latestReviewCountsByUser.get(user.id);
  if (cachedCounts) return cachedCounts;

  const { data, error } = await supabase.rpc("get_latest_vocabulary_review_counts");
  if (error) throw error;

  const counts: LatestVocabularyReviewCounts = { learning: 0, mastered: 0 };
  for (const row of data ?? []) {
    if (row.status === "mastered") counts.mastered = Number(row.review_count);
    else if (row.status === "learning") counts.learning = Number(row.review_count);
  }

  latestReviewCountsByUser.set(user.id, counts);
  return counts;
}
