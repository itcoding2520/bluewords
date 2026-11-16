import { getErrorMessage } from "@/lib/errors";
import { scheduleDeferredTask } from "@/lib/schedule-deferred-task";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchMyAssignments, startAssignedAssessment } from "@/lib/assignments/api";
import type { Assignment, AssignmentHistoryEntry } from "@/lib/assignments/types";
import { getOutstandingAssignments } from "@/lib/assignments/status";

export function useAssignmentsController() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"todo" | "history">("todo");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMyAssignments();
      setAssignments(data);
      setError("");
    } catch (cause) {
      setError(getErrorMessage(cause, "Could not load assignments."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    return scheduleDeferredTask(() => { void refresh(); });
  }, [refresh]);

  const outstanding = useMemo(() => getOutstandingAssignments(assignments), [assignments]);
  const history = useMemo<AssignmentHistoryEntry[]>(() => assignments
    .flatMap((item) => item.attempts.filter((attempt) => attempt.completed_at).map((attempt) => ({ assignment: item, attempt })))
    .sort((a, b) => new Date(b.attempt.completed_at!).getTime() - new Date(a.attempt.completed_at!).getTime()), [assignments]);

  async function start(assignmentId: string) {
    setStarting(assignmentId);
    setError("");
    try {
      const attemptId = await startAssignedAssessment(assignmentId);
      router.push(`/assignments/take/${attemptId}`);
    } catch (cause) {
      setError(getErrorMessage(cause, "Could not start this test."));
      setStarting(null);
    }
  }

  return {
    data: { outstanding, history },
    status: { loading, starting, error },
    navigation: { tab, setTab },
    actions: { start },
  };
}
