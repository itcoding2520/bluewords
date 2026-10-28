import { createClient } from "@/lib/supabase/client";
import { createInvalidatableAsyncCache } from "@/lib/supabase/invalidatable-async-cache.mjs";

export interface DailyReviewActivity {
  date: string;
  count: number;
}

export interface LearningAnalytics {
  totalReviews: number;
  rememberedReviews: number;
  currentStreak: number;
  dailyActivity: DailyReviewActivity[];
}

const analyticsCache = createInvalidatableAsyncCache();

export function invalidateLearningAnalyticsCache(userId?: string): void {
  analyticsCache.invalidate(userId);
}

export async function getLearningAnalytics(
  userId: string
): Promise<LearningAnalytics> {
  return analyticsCache.get(userId, loadLearningAnalytics);
}

export function getCachedLearningAnalytics(
  userId: string
): LearningAnalytics | undefined {
  return analyticsCache.peek(userId);
}

async function loadLearningAnalytics(): Promise<LearningAnalytics> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_learning_analytics");

  if (error) throw error;

  return data as LearningAnalytics;
}
