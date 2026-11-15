import { useEffect, useMemo, useState } from "react";
import {
  getCachedLatestVocabularyReviewHistory,
  getLatestVocabularyReviewHistory,
  type VocabularyReviewWithWord,
} from "@/lib/supabase/reviews";
import { getLocalReviewDay, groupReviewsByLocalDay } from "@/lib/review-history-view";
import { getPageCount, getPageItems, getPageRange } from "@/lib/pagination";

const PAGE_SIZE = 20;

export function useReviewHistoryController(userId: string) {
  const initialReviews = getCachedLatestVocabularyReviewHistory(userId);
  const [reviews, setReviews] = useState<VocabularyReviewWithWord[]>(
    () => initialReviews ?? []
  );
  const [selectedDay, setSelectedDay] = useState(() =>
    initialReviews?.[0] ? getLocalReviewDay(initialReviews[0].reviewed_at) : ""
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
            latestReviews.map((review) => getLocalReviewDay(review.reviewed_at))
          );
          return current && availableDays.has(current)
            ? current
            : latestReviews[0]
              ? getLocalReviewDay(latestReviews[0].reviewed_at)
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

  const dailyGroups = useMemo(() => groupReviewsByLocalDay(reviews), [reviews]);

  const selectedGroup = dailyGroups.find((group) => group.day === selectedDay);
  const earliestDay = dailyGroups[dailyGroups.length - 1]?.day;
  const latestDay = dailyGroups[0]?.day;
  const pageCount = getPageCount(selectedGroup?.reviews.length ?? 0, PAGE_SIZE);
  const currentPage = Math.min(page, pageCount);
  const pageReviews = selectedGroup
    ? getPageItems(selectedGroup.reviews, currentPage, PAGE_SIZE)
    : [];
  const pageRange = getPageRange(
    selectedGroup?.reviews.length ?? 0,
    currentPage,
    PAGE_SIZE
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
    firstVisible: pageRange.first,
    lastVisible: pageRange.last,
    pageCount,
    currentPage,
    pageSize: PAGE_SIZE,
  };
}
