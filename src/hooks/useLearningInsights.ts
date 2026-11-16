import { useEffect, useState } from "react";
import {
  getCachedLearningAnalytics,
  getLearningAnalytics,
  type LearningAnalytics as LearningAnalyticsData,
} from "@/lib/supabase/learning-analytics";

type AnalyticsState =
  | { userId: string; status: "loading" }
  | { userId: string; status: "error" }
  | { userId: string; status: "loaded"; data: LearningAnalyticsData };

export function useLearningInsights(userId: string) {
  const [state, setState] = useState<AnalyticsState>(() => {
    const cachedAnalytics = getCachedLearningAnalytics(userId);
    return cachedAnalytics
      ? { userId, status: "loaded", data: cachedAnalytics }
      : { userId, status: "loading" };
  });

  useEffect(() => {
    let active = true;

    void getLearningAnalytics(userId)
      .then((result) => {
        if (active) setState({ userId, status: "loaded", data: result });
      })
      .catch((error) => {
        console.error("Failed to load learning analytics:", error);
        if (active) setState({ userId, status: "error" });
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const currentState = state.userId === userId ? state : null;
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
