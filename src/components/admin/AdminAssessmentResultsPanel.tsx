"use client";

import { RefreshCw, Users } from "lucide-react";
import { formatDuration } from "@/lib/assignments/format-duration";
import { formatLocalDate } from "@/lib/formatDate";
import type { AssessmentAssignment, AssessmentAttempt } from "@/lib/assessments/admin-api";

export function AdminAssessmentResultsPanel({
  attempts,
  userById,
  assignmentByRecipientId,
  loading,
  onRefresh,
}: {
  attempts: AssessmentAttempt[];
  userById: Map<string, { nickname: string; email: string | undefined }>;
  assignmentByRecipientId: Map<string, AssessmentAssignment>;
  loading: boolean;
  onRefresh: () => void;
}) {
  return <section className="assessment-admin-card assessment-results-full"><div className="assessment-card-heading"><span><Users size={19} /></span><div><h2>Assessment results</h2><p>Completed attempts are visible to administrators here.</p></div><button type="button" className="assessment-refresh" onClick={onRefresh} aria-label="Refresh results"><RefreshCw size={17} /></button></div>
    {loading ? <p className="assessment-empty">Loading results…</p> : attempts.length ? <div className="assessment-admin-list">{attempts.map((attempt) => { const learner = userById.get(attempt.user_id); const assignment = assignmentByRecipientId.get(attempt.recipient_id); return <article key={attempt.id}><div><strong>{learner?.nickname || learner?.email || "Learner"}</strong><span>{assignment?.title ?? "Assessment"} · {attempt.correct_count}/10 correct · {attempt.score}/100</span><small>{attempt.result === "passed" ? "Passed" : "Not passed"} · {formatDuration(attempt.elapsed_seconds)}</small></div><time>{formatLocalDate(attempt.completed_at)}</time></article>; })}</div> : <p className="assessment-empty">Completed tests will appear here.</p>}
  </section>;
}
