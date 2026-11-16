import {
  getCachedLearningAnalytics,
  getLearningAnalytics,
} from "@/lib/supabase/learning-analytics";
import { useCachedUserResource } from "@/hooks/useCachedUserResource";

export function useLearningInsights(userId: string) {
  const currentState = useCachedUserResource(
    userId,
    getCachedLearningAnalytics,
    getLearningAnalytics,
    "Failed to load learning analytics:",
  );
  const analytics = currentState?.status === "loaded" ? currentState.data : null;
  const hasError = currentState?.status === "error";
  const accuracy = analytics && analytics.totalReviews > 0
    ? `${Math.round((analytics.rememberedReviews / analytics.totalReviews) * 100)}%`
    : "—";
  const maxDailyCount = Math.max(
    1,
    ...(analytics?.dailyActivity.map((day) => day.count) ?? [])
  );

  return { analytics, hasError, accuracy, maxDailyCount };
}
