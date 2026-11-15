import { useEffect, useState } from "react";
import {
  getCachedLearningAnalytics,
  getLearningAnalytics,
  type LearningAnalytics as LearningAnalyticsData,
} from "@/lib/supabase/learning-analytics";

export function useLearningInsights(userId: string) {
  const [analytics, setAnalytics] = useState<LearningAnalyticsData | null>(
    () => getCachedLearningAnalytics(userId) ?? null
  );
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;

    void getLearningAnalytics(userId)
      .then((result) => {
        if (active) setAnalytics(result);
      })
      .catch((error) => {
        console.error("Failed to load learning analytics:", error);
        if (active) setHasError(true);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const accuracy = analytics && analytics.totalReviews > 0
    ? `${Math.round((analytics.rememberedReviews / analytics.totalReviews) * 100)}%`
    : "—";
  const maxDailyCount = Math.max(
    1,
    ...(analytics?.dailyActivity.map((day) => day.count) ?? [])
  );

  return { analytics, hasError, accuracy, maxDailyCount };
}
