import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";

import { getErrorMessage } from "@/lib/errors";
import { scheduleDeferredTask } from "@/lib/schedule-deferred-task";
import {
  fetchAssessmentAdminSnapshot,
  type AssessmentAdminUser,
  type AssessmentAssignment,
  type AssessmentAttempt,
} from "@/lib/assessments/admin-api";

export function useAdminAssessmentsData(
  setError: Dispatch<SetStateAction<string>>
) {
  const [users, setUsers] = useState<AssessmentAdminUser[]>([]);
  const [assignments, setAssignments] = useState<AssessmentAssignment[]>([]);
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAssessmentAdminSnapshot();
      setUsers(data.users);
      setAssignments(data.assignments);
      setAttempts(data.attempts);
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

  return { users, assignments, attempts, loading, refresh };
}
