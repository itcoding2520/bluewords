import { useRef, useState } from "react";
import { toast } from "sonner";
import type { VocabularyReviewScheduleRow } from "@/types/database";
import { getVocabularyReviewSchedules } from "@/lib/supabase/reviews";

type ScheduleLoadState = "idle" | "loading" | "loaded" | "error";

export function useFlashcardReviewSchedules(isAuthenticated: boolean) {
  const [reviewSchedules, setReviewSchedules] = useState(() => new Map<string, VocabularyReviewScheduleRow>());
  const [loadState, setLoadState] = useState<ScheduleLoadState>("idle");
  const scheduleRequestRef = useRef<Promise<void> | null>(null);

  async function loadReviewSchedules() {
    if (!isAuthenticated) return;
    if (loadState === "loaded" || scheduleRequestRef.current) return scheduleRequestRef.current;

    setLoadState("loading");
    const request = getVocabularyReviewSchedules()
      .then((schedules) => {
        setReviewSchedules(new Map(schedules.map((schedule) => [schedule.vocabulary_word_id, schedule])));
        setLoadState("loaded");
      })
      .catch((error) => {
        console.error("Failed to load review schedules:", error);
        setLoadState("error");
        toast.error("Could not load review schedule.");
      })
      .finally(() => {
        scheduleRequestRef.current = null;
      });

    scheduleRequestRef.current = request;
    return request;
  }

  const areSchedulesLoaded = loadState === "loaded";

  return {
    reviewSchedules,
    setReviewSchedules,
    areSchedulesLoaded,
    isLoadingSchedules: loadState === "loading",
    scheduleLoadFailed: loadState === "error",
    loadReviewSchedules,
  };
}
