"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { BookOpenCheck, Flame, Target } from "lucide-react";

import { Card } from "@/components/ui/Card";
import {
  getLearningAnalytics,
  type LearningAnalytics as LearningAnalyticsData,
} from "@/lib/supabase/learning-analytics";

const weekdayFormatter = new Intl.DateTimeFormat("en", {
  weekday: "short",
  timeZone: "UTC",
});

function getWeekday(date: string): string {
  return weekdayFormatter.format(new Date(`${date}T12:00:00Z`));
}

export function LearningInsights({ userId }: { userId: string }) {
  const [analytics, setAnalytics] = useState<LearningAnalyticsData | null>(null);
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

  return (
    <Card className="mt-5 p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-slate-900">Learning activity</h2>
          <p className="mt-1 text-sm text-slate-500">
            Based on flashcard reviews, not just visits.
          </p>
        </div>
        {hasError && (
          <span className="text-xs text-slate-500">Could not load review stats</span>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Metric
          icon={<Flame size={18} />}
          label="Current streak"
          value={analytics ? `${analytics.currentStreak} days` : "—"}
          color="text-orange-600 bg-orange-50"
        />
        <Metric
          icon={<BookOpenCheck size={18} />}
          label="Cards reviewed"
          value={analytics?.totalReviews.toLocaleString() ?? "—"}
          color="text-blue-600 bg-blue-50"
        />
        <Metric
          icon={<Target size={18} />}
          label="Remembered"
          value={analytics ? accuracy : "—"}
          color="text-emerald-600 bg-emerald-50"
        />
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-700">Last 7 days</h3>
          {analytics?.totalReviews === 0 && (
            <span className="text-xs text-slate-500">Review a flashcard to start your activity</span>
          )}
        </div>
        <div className="grid h-24 grid-cols-7 items-end gap-2 sm:gap-4">
          {analytics?.dailyActivity.map((day) => (
            <div key={day.date} className="flex h-full flex-col items-center justify-end gap-2">
              <div
                className="w-full max-w-10 rounded-t-md bg-blue-500 transition-all"
                style={{ height: `${day.count === 0 ? 4 : Math.max(12, (day.count / maxDailyCount) * 100)}%` }}
                title={`${day.count} ${day.count === 1 ? "review" : "reviews"}`}
                aria-label={`${getWeekday(day.date)}: ${day.count} reviews`}
              />
              <span className="text-[11px] text-slate-500">{getWeekday(day.date)}</span>
            </div>
          ))}
          {!analytics && !hasError && Array.from({ length: 7 }, (_, index) => (
            <div key={index} className="h-4/5 animate-pulse rounded-t-md bg-slate-100" />
          ))}
        </div>
      </div>
    </Card>
  );
}

function Metric({
  icon,
  label,
  value,
  color,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3.5">
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${color}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-0.5 truncate font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}
