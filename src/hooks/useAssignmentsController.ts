import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchMyAssignments } from "@/lib/assignments/api";
import type { Assignment, AssignmentHistoryEntry } from "@/lib/assignments/types";

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
      setError(cause instanceof Error ? cause.message : "Could not load assignments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const outstanding = useMemo(() => assignments.filter((item) => item.status !== "completed"), [assignments]);
  const history = useMemo<AssignmentHistoryEntry[]>(() => assignments
    .flatMap((item) => item.attempts.filter((attempt) => attempt.completed_at).map((attempt) => ({ assignment: item, attempt })))
    .sort((a, b) => new Date(b.attempt.completed_at!).getTime() - new Date(a.attempt.completed_at!).getTime()), [assignments]);

  async function start(assignmentId: string) {
    setStarting(assignmentId);
    setError("");
    try {
      const response = await fetch(`/api/assessments/${assignmentId}/start`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not start this test.");
      router.push(`/assignments/take/${data.attempt.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start this test.");
      setStarting(null);
    }
  }

  return { outstanding, history, loading, starting, error, tab, setTab, start };
}
