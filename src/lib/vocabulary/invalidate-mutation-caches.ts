import { invalidateVocabularyPageCache } from "@/lib/supabase/vocabulary-page-cache.mjs";
import { invalidateDashboardVocabularyOverviewCache } from "@/lib/supabase/dashboard-vocabulary";
import { invalidateLatestVocabularyReviewsCache, invalidateVocabularyReviewScheduleCache } from "@/lib/supabase/reviews";
import { invalidateLearningAnalyticsCache } from "@/lib/supabase/learning-analytics";

type Options = {
  reviewHistory?: boolean;
  learningAnalytics?: boolean;
  reviewSchedule?: boolean;
};

export function invalidateVocabularyMutationCaches(ownerId?: string, options: Options = {}) {
  invalidateVocabularyPageCache();
  invalidateDashboardVocabularyOverviewCache(ownerId);
  if (options.reviewHistory) invalidateLatestVocabularyReviewsCache();
  if (options.learningAnalytics) invalidateLearningAnalyticsCache();
  if (options.reviewSchedule) invalidateVocabularyReviewScheduleCache();
}
