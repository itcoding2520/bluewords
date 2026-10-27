"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpenCheck, CalendarDays, CheckCircle2, History, Timer, Trophy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";

type Attempt = { id: string; attempt_number: number; score: number | null; correct_count: number | null; elapsed_seconds: number | null; result: string | null; started_at: string; completed_at: string | null };
type Assignment = { id: string; status: string; assignedAt: string; assessment: { id: string; title: string; difficulty: string; dueAt: string | null; questions: Array<{ type: string }> } | null; attempts: Attempt[] };
const vietnamDateKey = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);

export function AssignmentsContent() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"todo" | "history">("todo");
  const refresh = useCallback(async () => {
    setLoading(true);
    try { const response = await fetch("/api/assessments", { cache: "no-store" }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Could not load assignments."); setAssignments(data.assignments); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load assignments."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => { void refresh(); }, 0); return () => window.clearTimeout(timer); }, [refresh]);
  const outstanding = assignments.filter((item) => item.status !== "completed");
  const history = assignments.flatMap((item) => item.attempts.filter((attempt) => attempt.completed_at).map((attempt) => ({ assignment: item, attempt }))).sort((a, b) => new Date(b.attempt.completed_at!).getTime() - new Date(a.attempt.completed_at!).getTime());

  async function start(assignmentId: string) {
    setStarting(assignmentId); setError("");
    try { const response = await fetch(`/api/assessments/${assignmentId}/start`, { method: "POST" }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Could not start this test."); router.push(`/assignments/take/${data.attempt.id}`); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not start this test."); setStarting(null); }
  }

  return <div className="assignments-page">
    <header className="assignments-hero"><div className="assignments-hero-copy"><span>Keep learning!</span><h1 className="page-title">My assignments</h1><p className="page-intro-description">Practice your vocabulary and see your progress.</p></div><BookOpenCheck size={58} aria-hidden="true" /></header>
    {outstanding.length > 0 && <section className="assignments-alert"><div><Timer /><span><strong>{outstanding.length} {outstanding.length === 1 ? "test" : "tests"} waiting for you</strong><small>Complete your assigned tests to finish your learning tasks.</small></span></div><Button onClick={() => void start(outstanding[0].id)} disabled={starting !== null}>{starting === outstanding[0].id ? "Starting…" : "Start now"} <ArrowRight size={18} /></Button></section>}
    {error && <AutoDismissMessage variant="error" className="my-4">{error}</AutoDismissMessage>}
    <nav className="assignment-tabs"><button className={tab === "todo" ? "active" : ""} onClick={() => setTab("todo")}>To do ({outstanding.length})</button><button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}>History ({history.length})</button></nav>
    {loading ? <div className="assessment-loading">Loading your assignments…</div> : tab === "todo" ? <section className="assignment-list" aria-label="Tests to do">{outstanding.map((item) => {
      const assessment = item.assessment; if (!assessment) return null;
      const latest = item.attempts[0]; const due = assessment.dueAt ? new Date(assessment.dueAt) : null;
      const overdue = due && Number.isFinite(due.getTime()) && vietnamDateKey(due) < vietnamDateKey(new Date());
      return <article key={item.id} className={`assignment-card ${latest?.result === "failed" ? "is-retry" : ""}`}><div className="assignment-emoji"><BookOpenCheck size={25} /></div><div className="assignment-card-main"><h2>{assessment.title}</h2><span className={`difficulty-pill difficulty-${assessment.difficulty}`}>{assessment.difficulty}</span><p>10 questions <i>·</i> vocabulary and sentence building <i>·</i> about 10 minutes</p></div><div className="assignment-status"><span className={latest?.result === "failed" ? "failed" : item.status === "in_progress" ? "in-progress" : "not-started"}>{latest?.result === "failed" ? "Try again · last score " + latest.score : item.status === "in_progress" ? "In progress" : "Not started"}</span>{due && <small className={overdue ? "overdue" : undefined}><CalendarDays size={14} />{overdue ? "Overdue · " : "Due "}{due.toLocaleDateString()}</small>}</div><Button onClick={() => void start(item.id)} disabled={starting !== null}>{starting === item.id ? "Starting…" : latest?.result === "failed" ? "Try again" : item.status === "in_progress" ? "Continue" : overdue ? "Start late" : "Start test"} <ArrowRight size={17} /></Button></article>;
    })}{outstanding.length === 0 && <div className="assessment-empty-state"><CheckCircle2 /><h2>You’re all caught up!</h2><p>New assignments from your teacher will appear here.</p></div>}</section> : <section className="assignment-history" aria-label="Your test history">{history.map(({ assignment, attempt }) => <article key={attempt.id}><span className="history-trophy"><Trophy size={23} /></span><div><strong>{assignment.assessment?.title ?? "Assessment"}</strong><p>{assignment.assessment?.difficulty} · {attempt.correct_count}/10 correct · {formatDuration(attempt.elapsed_seconds ?? 0)}</p><small>{new Date(attempt.completed_at!).toLocaleString()} · Attempt {attempt.attempt_number}</small></div><b className={attempt.result === "passed" ? "passed" : "failed"}>{attempt.score}/100 · {attempt.result === "passed" ? "Passed" : "Not passed"}</b><Link href={`/assignments/results/${attempt.id}`}>Review answers <ArrowRight size={16} /></Link></article>)}{history.length === 0 && <div className="assessment-empty-state"><History /><h2>Your test history will appear here</h2><p>Only you can see your assessment results.</p></div>}</section>}
    <p className="assessment-private-note">🔒 Your test results and history are private. Only you can see them.</p>
  </div>;
}

export function formatDuration(seconds: number) { return `${Math.floor(seconds / 60)}m ${seconds % 60}s`; }
