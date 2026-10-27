"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { formatDuration } from "@/components/assignments/AssignmentsContent";

type ReviewQuestion = { type: "vocabulary" | "sentence"; prompt: string; answer: string; word?: string; meaning?: string };
type ReviewAttempt = { id: string; attempt_number: number; questions: ReviewQuestion[]; answers: string[]; score: number; correct_count: number; elapsed_seconds: number; result: string; completed_at: string; assessment_recipients: { assessments: { title: string; difficulty: string } | Array<{ title: string; difficulty: string }> } | Array<{ assessments: { title: string; difficulty: string } | Array<{ title: string; difficulty: string }> }> };
const normalize = (value: string) => value.trim().toLowerCase().replace(/\s+([.,!?])/g, "$1").replace(/\s+/g, " ");

export function AssessmentReview({ attemptId }: { attemptId: string }) {
  const [attempt, setAttempt] = useState<ReviewAttempt | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => { try { const response = await fetch(`/api/assessments/attempts/${attemptId}`, { cache: "no-store" }); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Could not load result."); setAttempt(data.attempt); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load result."); } }, [attemptId]);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);
  if (error) return <p role="alert" className="assessment-error">{error}</p>;
  if (!attempt) return <p className="assessment-loading">Loading your result…</p>;
  const recipient = Array.isArray(attempt.assessment_recipients) ? attempt.assessment_recipients[0] : attempt.assessment_recipients;
  const assessment = recipient ? (Array.isArray(recipient.assessments) ? recipient.assessments[0] : recipient.assessments) : null;
  const passed = attempt.score > 50;
  return <div className="assessment-review-page">
    <Link className="assessment-back-link" href="/assignments"><ArrowLeft size={17} /> Back to my assignments</Link>
    <header className={`assessment-score-hero ${passed ? "passed" : "failed"}`}><span>{passed ? <CheckCircle2 /> : <XCircle />}{passed ? "Completed — You passed!" : "Not passed yet — Try again"}</span><h1>{assessment?.title ?? "Assessment result"} · {assessment?.difficulty}</h1><p>{passed ? "Great work. You completed this assigned test." : "You need more than 50 points to pass. Review the answers and try again."}</p><div className="assessment-score-number"><strong>{attempt.score}</strong><span>/ 100 points</span></div></header>
    <section className="assessment-result-stats"><div><CheckCircle2 /><strong>{attempt.correct_count}</strong><span>Correct</span></div><div><XCircle /><strong>{10 - attempt.correct_count}</strong><span>Incorrect</span></div><div><Clock3 /><strong>{formatDuration(attempt.elapsed_seconds)}</strong><span>Time taken</span></div><div><strong>{new Date(attempt.completed_at).toLocaleDateString()}</strong><span>Completed</span></div></section>
    <section className="assessment-review-answers"><div className="assessment-card-heading"><span><CheckCircle2 size={19} /></span><div><h2>Review your answers</h2><p>Only you can see this report.</p></div></div>{attempt.questions.map((question, index) => { const correct = normalize(attempt.answers[index] ?? "") === normalize(question.answer); return <article key={index} className={correct ? "correct" : "incorrect"}><span className="assessment-review-index">{index + 1}</span><div><h3>{question.prompt}</h3><p>Your answer: <strong>{attempt.answers[index] || "No answer"}</strong></p>{!correct && <small>Correct answer: {question.answer}</small>}</div>{correct ? <CheckCircle2 /> : <XCircle />}</article>; })}</section>
    {!passed && <Link className="assessment-retry-button" href="/assignments">Try again</Link>}
  </div>;
}
