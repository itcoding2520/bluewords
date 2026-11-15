import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toLocalDateInputValue } from "@/lib/formatDate";

export type AssessmentAdminTab = "tests" | "assignments" | "results";
export type AssessmentAdminUser = { id: string; email: string | undefined; nickname: string };
export type AssessmentRecipient = { id: string; user_id: string; status: string };
export type AssessmentAssignment = { id: string; title: string; difficulty: string; due_at: string | null; created_at: string; assessment_recipients: AssessmentRecipient[] };
export type AssessmentAttempt = { id: string; user_id: string; recipient_id: string; score: number; correct_count: number; elapsed_seconds: number; result: string; completed_at: string; attempt_number: number };

export function useAdminAssessmentsController() {
  const [activeTab, setActiveTab] = useState<AssessmentAdminTab>("tests");
  const [users, setUsers] = useState<AssessmentAdminUser[]>([]);
  const [assignments, setAssignments] = useState<AssessmentAssignment[]>([]);
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);
  const [title, setTitle] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [selected, setSelected] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState(false);
  const [dueAt, setDueAt] = useState("");
  const today = toLocalDateInputValue(new Date());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/assessments", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load assignments.");
      setUsers(data.users); setAssignments(data.assignments); setAttempts(data.attempts); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load assignments."); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const visibleUsers = useMemo(() => users.filter((item) => `${item.nickname} ${item.email ?? ""}`.toLowerCase().includes(search.toLowerCase())), [users, search]);
  const userById = useMemo(() => new Map(users.map((item) => [item.id, item])), [users]);

  async function assign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSending(true); setError(""); setNotice("");
    if (dueAt && today && dueAt < today) {
      setError("Due date must be today or a future date.");
      setSending(false);
      return;
    }
    try {
      const response = await fetch("/api/admin/assessments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, difficulty, allUsers, recipientIds: selected, dueAt: dueAt || null }) });
      const data = await response.json();
      if (!response.ok && response.status !== 207) throw new Error(data.error ?? "Could not assign test.");
      setNotice(`Test assigned to ${data.recipients ?? "selected"} learner(s).`);
      setTitle(""); setSelected([]); setAllUsers(false); setDueAt("");
      setActiveTab("tests");
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not assign test."); }
    finally { setSending(false); }
  }

  return {
    activeTab, setActiveTab, users, assignments, attempts, title, setTitle, difficulty, setDifficulty, selected, setSelected,
    allUsers, setAllUsers, dueAt, setDueAt, today, search, setSearch, loading, sending, error, notice,
    visibleUsers, userById, refresh, assign,
  };
}
