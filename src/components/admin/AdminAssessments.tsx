"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ClipboardList, RefreshCw, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { Select } from "@/components/ui/Select";
import { toLocalDateInputValue } from "@/lib/formatDate";

type UserRow = { id: string; email: string | undefined; nickname: string };
type Recipient = { id: string; user_id: string; status: string };
type Assignment = { id: string; title: string; difficulty: string; due_at: string | null; created_at: string; assessment_recipients: Recipient[] };
type Attempt = { id: string; user_id: string; recipient_id: string; score: number; correct_count: number; elapsed_seconds: number; result: string; completed_at: string; attempt_number: number };

export function AdminAssessments() {
  const [activeTab, setActiveTab] = useState<"tests" | "assignments" | "results">("tests");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
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

  async function assign(event: React.FormEvent<HTMLFormElement>) {
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

  return <div className="assessment-admin-page">
    <header className="assessment-admin-hero"><div className="assessment-admin-hero-copy"><p>Administration</p><h1 className="page-title">Assessment management</h1><span>Create randomized 10-question tests, assign them, and review results.</span></div><ClipboardList size={54} aria-hidden="true" /></header>
    {error && <AutoDismissMessage variant="error" className="my-4">{error}</AutoDismissMessage>}{notice && <AutoDismissMessage variant="success" className="my-4">{notice}</AutoDismissMessage>}
    <nav className="assessment-admin-tabs" aria-label="Assessment management sections">
      {([ ["tests", "Tests"], ["assignments", "Assignments"], ["results", "Results"] ] as const).map(([id, label]) => <button type="button" key={id} className={activeTab === id ? "active" : ""} aria-current={activeTab === id ? "page" : undefined} onClick={() => setActiveTab(id)}>{label}</button>)}
    </nav>
    <div className="assessment-admin-grid">
      {activeTab === "tests" && <>
        <section className="assessment-admin-card assessment-create-form">
          <div className="assessment-card-heading"><span><ClipboardList size={19} /></span><div><h2>Create a test</h2><p>Choose a title and level. BlueWords builds a fresh set of 10 questions.</p></div></div>
          <label>Test title<input required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Everyday English" /></label>
          <label>Difficulty<Select aria-label="Difficulty" containerClassName="w-full" className="!h-[2.65rem] !rounded-xl !border-slate-200 !px-3 !text-sm" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option value="easy">Easy · Dễ</option><option value="medium">Medium · Trung bình</option><option value="hard">Hard · Khó</option></Select></label>
          <p className="assessment-fixed-info">Each correct answer earns 10 points. Learners pass with more than 50 points; 50 or less means they try again.</p>
          <Button type="button" disabled={!title.trim()} onClick={() => setActiveTab("assignments")}>Continue to assignments <Send size={17} /></Button>
        </section>
        <section className="assessment-admin-card assessment-test-blueprint"><div className="assessment-card-heading"><span><ClipboardList size={19} /></span><div><h2>Test blueprint</h2><p>Questions are selected from the active word and sentence banks.</p></div></div><div className="assessment-blueprint-grid"><article><b>5</b><strong>Vocabulary</strong><span>Meaning choices with picture clues</span></article><article><b>5</b><strong>Sentence building</strong><span>Arrange tiles from a Vietnamese clue</span></article></div><p className="assessment-private-note">All 10 questions are shuffled for each learner and each retry.</p></section>
      </>}
      {activeTab === "assignments" && <>
        <form className="assessment-admin-card assessment-create-form" onSubmit={(event) => void assign(event)}>
          <div className="assessment-card-heading"><span><Users size={19} /></span><div><h2>Assign this test</h2><p>{title || "Add a title in Tests first"} · {difficulty} · 10 questions</p></div></div>
          <div className="assessment-recipient-toggle"><button type="button" className={!allUsers ? "active" : ""} onClick={() => setAllUsers(false)}><Users size={16} /> Choose users</button><button type="button" className={allUsers ? "active" : ""} onClick={() => { setAllUsers(true); setSelected([]); }}><Users size={16} /> All users ({users.length})</button></div>
          {!allUsers && <div className="assessment-user-picker"><input aria-label="Search learners" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by email or nickname" /><div>{visibleUsers.map((item) => <label key={item.id}><input type="checkbox" checked={selected.includes(item.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} /><span><b>{item.nickname || item.email || "Learner"}</b><small>{item.email}</small></span></label>)}</div></div>}
          <label className="assessment-date-field"><CalendarDays size={17} /> Due date (optional)<input type="date" min={today || undefined} value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></label>
          <Button type="submit" disabled={sending || loading || !title.trim() || (!allUsers && selected.length === 0)}><Send size={17} /> Assign test to learners</Button>
        </form>
        <section className="assessment-admin-card"><div className="assessment-card-heading"><span><CalendarDays size={19} /></span><div><h2>Recent assignments</h2><p>Track who has started and completed each test.</p></div><button type="button" className="assessment-refresh" onClick={() => void refresh()} aria-label="Refresh assignments"><RefreshCw size={17} /></button></div>
          {loading ? <p className="assessment-empty">Loading assignments…</p> : assignments.length ? <div className="assessment-admin-list">{assignments.map((item) => { const done = item.assessment_recipients.filter((recipient) => recipient.status === "completed").length; return <article key={item.id}><div><strong>{item.title}</strong><span>{item.difficulty} · 10 questions · {done}/{item.assessment_recipients.length} complete</span><small>{item.due_at ? `Due ${new Date(item.due_at).toLocaleDateString()}` : "No due date"}</small></div><span className="assessment-progress">{Math.round(done / Math.max(1, item.assessment_recipients.length) * 100)}%</span></article>; })}</div> : <p className="assessment-empty">No assignments yet.</p>}
        </section>
      </>}
      {activeTab === "results" && <section className="assessment-admin-card assessment-results-full"><div className="assessment-card-heading"><span><Users size={19} /></span><div><h2>Assessment results</h2><p>Completed attempts are visible to administrators here.</p></div><button type="button" className="assessment-refresh" onClick={() => void refresh()} aria-label="Refresh results"><RefreshCw size={17} /></button></div>
        {loading ? <p className="assessment-empty">Loading results…</p> : attempts.length ? <div className="assessment-admin-list">{attempts.map((attempt) => { const learner = userById.get(attempt.user_id); const assignment = assignments.find((item) => item.assessment_recipients.some((recipient) => recipient.id === attempt.recipient_id)); return <article key={attempt.id}><div><strong>{learner?.nickname || learner?.email || "Learner"}</strong><span>{assignment?.title ?? "Assessment"} · {attempt.correct_count}/10 correct · {attempt.score}/100</span><small>{attempt.result === "passed" ? "Passed" : "Not passed"} · {Math.floor(attempt.elapsed_seconds / 60)}m {attempt.elapsed_seconds % 60}s</small></div><time>{new Date(attempt.completed_at).toLocaleDateString()}</time></article>; })}</div> : <p className="assessment-empty">Completed tests will appear here.</p>}
      </section>}
    </div>
    <p className="assessment-admin-privacy">Learners can only access their own assignments and results. Test answers are checked on the server.</p>
  </div>;
}
