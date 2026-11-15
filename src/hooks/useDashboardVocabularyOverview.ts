import { useEffect, useState } from "react";
import {
  getCachedDashboardVocabularyOverview,
  getDashboardVocabularyOverview,
  type DashboardVocabularyOverview,
} from "@/lib/supabase/dashboard-vocabulary";

type OverviewState =
  | { userId: string; status: "loading" }
  | { userId: string; status: "error" }
  | { userId: string; status: "loaded"; data: DashboardVocabularyOverview };

export function useDashboardVocabularyOverview(userId: string) {
  const [overviewState, setOverviewState] = useState<OverviewState>(() => {
    const cachedOverview = getCachedDashboardVocabularyOverview(userId);
    return cachedOverview
      ? { userId, status: "loaded", data: cachedOverview }
      : { userId, status: "loading" };
  });

  useEffect(() => {
    let active = true;
    void getDashboardVocabularyOverview(userId)
      .then((result) => {
        if (active) setOverviewState({ userId, status: "loaded", data: result });
      })
      .catch((error) => {
        console.error("Failed to load dashboard vocabulary overview:", error);
        if (active) setOverviewState({ userId, status: "error" });
      });
    return () => {
      active = false;
    };
  }, [userId]);

  return overviewState.userId === userId ? overviewState : null;
}
