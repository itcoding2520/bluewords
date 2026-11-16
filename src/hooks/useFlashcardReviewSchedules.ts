import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { toast } from "sonner";
import type { VocabularyReviewScheduleRow } from "@/types/database";
import { getVocabularyReviewSchedules } from "@/lib/supabase/reviews";
import { resolveStateAction } from "@/lib/state-action";

type ScheduleLoadState = "idle" | "loading" | "loaded" | "error";
interface ReviewScheduleState {
  schedules: Map<string, VocabularyReviewScheduleRow>;
  loadState: ScheduleLoadState;
}

export function useFlashcardReviewSchedules(isAuthenticated: boolean) {
  const [state, setState] = useState<ReviewScheduleState>(() => ({
    schedules: new Map<string, VocabularyReviewScheduleRow>(),
    loadState: "idle",
  }));
  const scheduleRequestRef = useRef<Promise<void> | null>(null);
  const setReviewSchedules = useCallback<Dispatch<SetStateAction<Map<string, VocabularyReviewScheduleRow>>>>((action) => {
    setState((current) => ({
      ...current,
      schedules: resolveStateAction(current.schedules, action),
    }));
  }, []);

  async function loadReviewSchedules() {
    if (!isAuthenticated) return;
    if (state.loadState === "loaded" || scheduleRequestRef.current) return scheduleRequestRef.current;

    setState((current) => ({ ...current, loadState: "loading" }));
    const request = getVocabularyReviewSchedules()
      .then((schedules) => {
        setState({
          schedules: new Map(schedules.map((schedule) => [schedule.vocabulary_word_id, schedule])),
          loadState: "loaded",
        });
      })
      .catch((error) => {
        console.error("Failed to load review schedules:", error);
        setState((current) => ({ ...current, loadState: "error" }));
        toast.error("Could not load review schedule.");
      })
      .finally(() => {
        scheduleRequestRef.current = null;
      });

    scheduleRequestRef.current = request;
    return request;
  }

  const areSchedulesLoaded = state.loadState === "loaded";

  return {
    reviewSchedules: state.schedules,
    setReviewSchedules,
    areSchedulesLoaded,
    isLoadingSchedules: state.loadState === "loading",
    scheduleLoadFailed: state.loadState === "error",
    loadReviewSchedules,
  };
}
