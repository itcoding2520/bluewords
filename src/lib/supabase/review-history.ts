import { createClient } from "@/lib/supabase/client";
import type { VocabularyStatus } from "@/data/vocabulary";
import { fetchAllPages } from "@/lib/supabase/fetch-all-pages.mjs";
import { requireAuthenticatedUser } from "@/lib/supabase/authenticated-user";
import { mapLatestReviewRows, type LatestReviewRpcRow, type VocabularyReviewWithWord } from "@/lib/supabase/review-history-mapping";
import {
  cacheLatestVocabularyReviewCounts,
  cacheLatestVocabularyReviewHistory,
  cacheLatestVocabularyReviews,
  getCachedLatestVocabularyReviewCounts,
  getCachedLatestVocabularyReviewHistory,
  getCachedLatestVocabularyReviews,
  type LatestVocabularyReviewCounts,
  type LatestVocabularyReviewsPage,
} from "@/lib/supabase/review-history-cache";
export type { VocabularyReviewWithWord } from "@/lib/supabase/review-history-mapping";
export { getCachedLatestVocabularyReviewCounts, getCachedLatestVocabularyReviewHistory, getCachedLatestVocabularyReviews, invalidateLatestVocabularyReviewsCache } from "@/lib/supabase/review-history-cache";
export type { LatestVocabularyReviewCounts, LatestVocabularyReviewsPage } from "@/lib/supabase/review-history-cache";

const supabase = createClient();
const REVIEW_HISTORY_PAGE_SIZE = 20;

export async function getLatestVocabularyReviewHistory(
  expectedUserId: string
): Promise<VocabularyReviewWithWord[]> {
  const errorMessage = "You must be logged in to view review history.";
  const user = await requireAuthenticatedUser(supabase, errorMessage);
  if (user.id !== expectedUserId) throw new Error(errorMessage);

  const cached = getCachedLatestVocabularyReviewHistory(user.id);
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
  cacheLatestVocabularyReviewHistory(user.id, reviews);
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

  const cachedPage = getCachedLatestVocabularyReviews(user.id, input.status, input.page, pageSize);
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
  cacheLatestVocabularyReviews(user.id, input.status, input.page, pageSize, result);
  return result;
}

export async function getLatestVocabularyReviewCounts(): Promise<LatestVocabularyReviewCounts> {
  const user = await requireAuthenticatedUser(supabase, "You must be logged in to view review history.");

  const cachedCounts = getCachedLatestVocabularyReviewCounts(user.id);
  if (cachedCounts) return cachedCounts;

  const { data, error } = await supabase.rpc("get_latest_vocabulary_review_counts");
  if (error) throw error;

  const counts: LatestVocabularyReviewCounts = { learning: 0, mastered: 0 };
  for (const row of data ?? []) {
    if (row.status === "mastered") counts.mastered = Number(row.review_count);
    else if (row.status === "learning") counts.learning = Number(row.review_count);
  }

  cacheLatestVocabularyReviewCounts(user.id, counts);
  return counts;
}
