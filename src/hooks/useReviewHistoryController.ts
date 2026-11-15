import { useEffect, useMemo, useState } from "react";
import {
  getCachedLatestVocabularyReviewHistory,
  getLatestVocabularyReviewHistory,
  type VocabularyReviewWithWord,
} from "@/lib/supabase/reviews";
import { getLocalReviewDay, groupReviewsByLocalDay } from "@/lib/review-history-view";
import { getPageItems, getPageMetadata } from "@/lib/pagination";

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
  const pageMetadata = getPageMetadata(selectedGroup?.reviews.length ?? 0, page, PAGE_SIZE);
  const pageReviews = selectedGroup
    ? getPageItems(selectedGroup.reviews, pageMetadata.currentPage, PAGE_SIZE)
    : [];

  return {
    loading: { isLoading, loadFailed },
    data: { dailyGroups, selectedGroup, earliestDay, latestDay, pageReviews },
    selection: { selectedDay, setSelectedDay },
    pagination: {
      setPage,
      firstVisible: pageMetadata.first,
      lastVisible: pageMetadata.last,
      pageCount: pageMetadata.pageCount,
      currentPage: pageMetadata.currentPage,
      pageSize: PAGE_SIZE,
    },
  };
}
