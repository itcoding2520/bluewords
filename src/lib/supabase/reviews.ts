export {
  getCachedLatestVocabularyReviews,
  getCachedLatestVocabularyReviewCounts,
  getCachedLatestVocabularyReviewHistory,
  getLatestVocabularyReviewHistory,
  getLatestVocabularyReviews,
  getLatestVocabularyReviewCounts,
  invalidateLatestVocabularyReviewsCache,
} from "@/lib/supabase/review-history";
export type {
  LatestVocabularyReviewsPage,
  LatestVocabularyReviewCounts,
  VocabularyReviewWithWord,
} from "@/lib/supabase/review-history";

export {
  getVocabularyReviewSchedules,
  invalidateVocabularyReviewScheduleCache,
  recordVocabularyReview,
} from "@/lib/supabase/review-schedules";
