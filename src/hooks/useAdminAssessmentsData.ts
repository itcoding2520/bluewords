import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";

import { getErrorMessage } from "@/lib/errors";
import { scheduleDeferredTask } from "@/lib/schedule-deferred-task";
import {
  fetchAssessmentAdminSnapshot,
  type AssessmentAdminSnapshot,
} from "@/lib/assessments/admin-api";

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
    setLoading(true);
    try {
      const data = await fetchAssessmentAdminSnapshot();
      setSnapshot(data);
      setError("");
    } catch (cause) {
      setError(getErrorMessage(cause, "Could not load assignments."));
    } finally {
      setLoading(false);
    }
  }, [setError]);

  useEffect(() => {
    return scheduleDeferredTask(() => { void refresh(); });
  }, [refresh]);

  return { ...snapshot, loading, refresh };
}
