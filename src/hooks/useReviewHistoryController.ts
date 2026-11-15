import { useEffect, useMemo, useState } from "react";
import {
  getCachedLatestVocabularyReviewHistory,
  getLatestVocabularyReviewHistory,
  type VocabularyReviewWithWord,
} from "@/lib/supabase/reviews";

const PAGE_SIZE = 20;

interface DailyReviewGroup {
  day: string;
  reviews: VocabularyReviewWithWord[];
  learning: number;
  mastered: number;
}

function getLocalDay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function useReviewHistoryController(userId: string) {
  const initialReviews = getCachedLatestVocabularyReviewHistory(userId);
  const [reviews, setReviews] = useState<VocabularyReviewWithWord[]>(
    () => initialReviews ?? []
  );
  const [selectedDay, setSelectedDay] = useState(() =>
    initialReviews?.[0] ? getLocalDay(initialReviews[0].reviewed_at) : ""
  );
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(initialReviews === null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getLatestVocabularyReviewHistory(userId)
      .then((latestReviews) => {
        if (cancelled) return;
        setReviews(latestReviews);
        setSelectedDay((current) => {
          const availableDays = new Set(
            latestReviews.map((review) => getLocalDay(review.reviewed_at))
          );
          return current && availableDays.has(current)
            ? current
            : latestReviews[0]
              ? getLocalDay(latestReviews[0].reviewed_at)
              : "";
        });
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadFailed(true);
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const dailyGroups = useMemo(() => {
    const groups = new Map<string, DailyReviewGroup>();
    for (const review of reviews) {
      const day = getLocalDay(review.reviewed_at);
      if (!day) continue;
      let group = groups.get(day);
      if (!group) {
        group = { day, reviews: [], learning: 0, mastered: 0 };
        groups.set(day, group);
      }
      group.reviews.push(review);
      if (review.vocabulary_words?.status === "mastered") group.mastered += 1;
      else group.learning += 1;
    }
    return [...groups.values()].sort((left, right) =>
      right.day.localeCompare(left.day)
    );
  }, [reviews]);

  const selectedGroup = dailyGroups.find((group) => group.day === selectedDay);
  const earliestDay = dailyGroups[dailyGroups.length - 1]?.day;
  const latestDay = dailyGroups[0]?.day;
  const pageCount = Math.max(
    1,
    Math.ceil((selectedGroup?.reviews.length ?? 0) / PAGE_SIZE)
  );
  const currentPage = Math.min(page, pageCount);
  const pageReviews =
    selectedGroup?.reviews.slice(
      (currentPage - 1) * PAGE_SIZE,
      currentPage * PAGE_SIZE
    ) ?? [];
  const firstVisible =
    pageReviews.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastVisible = Math.min(
    currentPage * PAGE_SIZE,
    selectedGroup?.reviews.length ?? 0
  );

  return {
    isLoading,
    loadFailed,
    dailyGroups,
    selectedGroup,
    selectedDay,
    setSelectedDay,
    setPage,
    earliestDay,
    latestDay,
    pageReviews,
    firstVisible,
    lastVisible,
    pageCount,
    currentPage,
    pageSize: PAGE_SIZE,
  };
}
