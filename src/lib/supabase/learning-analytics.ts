import { createClient } from "@/lib/supabase/client";

const TIME_ZONE = "Asia/Ho_Chi_Minh";
const supabase = createClient();

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

const analyticsCache = new Map<string, LearningAnalytics>();
const analyticsRequests = new Map<string, Promise<LearningAnalytics>>();

export function invalidateLearningAnalyticsCache(userId?: string): void {
  if (userId) {
    analyticsCache.delete(userId);
    return;
  }

  analyticsCache.clear();
}

export async function getLearningAnalytics(
  userId: string
): Promise<LearningAnalytics> {
  const cached = analyticsCache.get(userId);
  if (cached) return cached;

  const pending = analyticsRequests.get(userId);
  if (pending) return pending;

  const request = loadLearningAnalytics(userId);
  analyticsRequests.set(userId, request);

  try {
    const analytics = await request;
    analyticsCache.set(userId, analytics);
    return analytics;
  } finally {
    analyticsRequests.delete(userId);
  }
}

async function loadLearningAnalytics(userId: string): Promise<LearningAnalytics> {
  const reviews: Array<{ reviewed_at: string; remembered: boolean }> = [];
  const pageSize = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("vocabulary_reviews")
      .select("reviewed_at, remembered")
      .eq("user_id", userId)
      .order("reviewed_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;
    reviews.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
    offset += pageSize;
  }

  const dailyCounts = new Map<string, number>();
  let rememberedReviews = 0;

  for (const review of reviews) {
    const date = getLocalDateKey(new Date(review.reviewed_at));
    dailyCounts.set(date, (dailyCounts.get(date) ?? 0) + 1);
    if (review.remembered) rememberedReviews += 1;
  }

  const today = getLocalDateKey(new Date());
  const yesterday = addDays(today, -1);
  let streakCursor = dailyCounts.has(today)
    ? today
    : dailyCounts.has(yesterday)
      ? yesterday
      : null;
  let currentStreak = 0;

  while (streakCursor && dailyCounts.has(streakCursor)) {
    currentStreak += 1;
    streakCursor = addDays(streakCursor, -1);
  }

  const dailyActivity = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index - 6);
    return { date, count: dailyCounts.get(date) ?? 0 };
  });

  return {
    totalReviews: reviews.length,
    rememberedReviews,
    currentStreak,
    dailyActivity,
  };
}

function getLocalDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function addDays(date: string, amount: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + amount));
  return [
    next.getUTCFullYear(),
    String(next.getUTCMonth() + 1).padStart(2, "0"),
    String(next.getUTCDate()).padStart(2, "0"),
  ].join("-");
}
