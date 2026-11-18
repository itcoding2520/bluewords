import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";

import { getErrorMessage } from "@/lib/errors";
import { scheduleDeferredTask } from "@/lib/schedule-deferred-task";
import {
  fetchAssessmentAdminSnapshot,
  type AssessmentAdminSnapshot,
} from "@/lib/assessments/admin-api";
import { runWithBusyState } from "@/lib/run-with-busy-state";

export function useAdminAssessmentsData(
  setError: Dispatch<SetStateAction<string>>
) {
  const [snapshot, setSnapshot] = useState<AssessmentAdminSnapshot>({
    users: [],
    assignments: [],
    attempts: [],
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    await runWithBusyState(setLoading, async () => {
      try {
        const data = await fetchAssessmentAdminSnapshot();
        setSnapshot(data);
        setError("");
      } catch (cause) {
        setError(getErrorMessage(cause, "Could not load assignments."));
      }
    });
  }, [setError]);

  useEffect(() => {
    return scheduleDeferredTask(() => { void refresh(); });
  }, [refresh]);

  return { ...snapshot, loading, refresh };
}
