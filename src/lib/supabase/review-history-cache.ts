import type { VocabularyStatus } from "@/data/vocabulary";
import type { VocabularyReviewWithWord } from "@/lib/supabase/review-history-mapping";

export interface LatestVocabularyReviewsPage {
  reviews: VocabularyReviewWithWord[];
  total: number;
}

export interface LatestVocabularyReviewCounts {
  learning: number;
  mastered: number;
}

const latestReviewsByPage = new Map<string, LatestVocabularyReviewsPage>();
const latestReviewCountsByUser = new Map<string, LatestVocabularyReviewCounts>();
const latestReviewHistoryByUser = new Map<string, VocabularyReviewWithWord[]>();

const REVIEW_HISTORY_PAGE_SIZE = 20;

function reviewPageCacheKey(userId: string, status: VocabularyStatus, page: number, pageSize: number): string {
  return `${userId}:${status}:${page}:${pageSize}`;
}

export function getCachedLatestVocabularyReviews(userId: string, status: VocabularyStatus, page = 1, pageSize = REVIEW_HISTORY_PAGE_SIZE): LatestVocabularyReviewsPage | null {
  return latestReviewsByPage.get(reviewPageCacheKey(userId, status, page, pageSize)) ?? null;
}

export function cacheLatestVocabularyReviews(userId: string, status: VocabularyStatus, page: number, pageSize: number, result: LatestVocabularyReviewsPage): void {
  latestReviewsByPage.set(reviewPageCacheKey(userId, status, page, pageSize), result);
}

export function getCachedLatestVocabularyReviewCounts(userId: string): LatestVocabularyReviewCounts | null {
  return latestReviewCountsByUser.get(userId) ?? null;
}

export function cacheLatestVocabularyReviewCounts(userId: string, counts: LatestVocabularyReviewCounts): void {
  latestReviewCountsByUser.set(userId, counts);
}

export function getCachedLatestVocabularyReviewHistory(userId: string): VocabularyReviewWithWord[] | null {
  return latestReviewHistoryByUser.get(userId) ?? null;
}

export function cacheLatestVocabularyReviewHistory(userId: string, reviews: VocabularyReviewWithWord[]): void {
  latestReviewHistoryByUser.set(userId, reviews);
}

export function invalidateLatestVocabularyReviewsCache(): void {
  latestReviewsByPage.clear();
  latestReviewCountsByUser.clear();
  latestReviewHistoryByUser.clear();
}
