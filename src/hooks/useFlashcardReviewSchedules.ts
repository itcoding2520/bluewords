import { useRef, useState } from "react";
import { toast } from "sonner";
import type { VocabularyReviewScheduleRow } from "@/types/database";
import { getVocabularyReviewSchedules } from "@/lib/supabase/reviews";

export function useFlashcardReviewSchedules(isAuthenticated: boolean) {
  const [reviewSchedules, setReviewSchedules] = useState(() => new Map<string, VocabularyReviewScheduleRow>());
  const [areSchedulesLoaded, setAreSchedulesLoaded] = useState(false);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [scheduleLoadFailed, setScheduleLoadFailed] = useState(false);
  const scheduleRequestRef = useRef<Promise<void> | null>(null);

  async function loadReviewSchedules() {
    if (!isAuthenticated) return;
    if (areSchedulesLoaded || scheduleRequestRef.current) return scheduleRequestRef.current;

    setIsLoadingSchedules(true);
    setScheduleLoadFailed(false);
    const request = getVocabularyReviewSchedules()
      .then((schedules) => {
        setReviewSchedules(new Map(schedules.map((schedule) => [schedule.vocabulary_word_id, schedule])));
        setAreSchedulesLoaded(true);
      })
      .catch((error) => {
        console.error("Failed to load review schedules:", error);
        setScheduleLoadFailed(true);
        toast.error("Could not load review schedule.");
      })
      .finally(() => {
        scheduleRequestRef.current = null;
        setIsLoadingSchedules(false);
      });

    scheduleRequestRef.current = request;
    return request;
  }

  return {
    reviewSchedules,
    setReviewSchedules,
    areSchedulesLoaded,
    isLoadingSchedules,
    scheduleLoadFailed,
    loadReviewSchedules,
  };
}
