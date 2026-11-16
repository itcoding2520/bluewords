import { formatDuration } from "@/lib/assignments/format-duration";
import { formatLocalDate } from "@/lib/formatDate";
import type { AssessmentAttempt } from "@/lib/assessments/admin-api";

export function AdminAssessmentResultRow({
  attempt,
  learnerName,
  assignmentTitle,
}: {
  attempt: AssessmentAttempt;
  learnerName: string;
  assignmentTitle: string;
}) {
  return (
    <article>
      <div>
        <strong>{learnerName}</strong>
        <span>{assignmentTitle} · {attempt.correct_count}/10 correct · {attempt.score}/100</span>
        <small>{attempt.result === "passed" ? "Passed" : "Not passed"} · {formatDuration(attempt.elapsed_seconds)}</small>
      </div>
      <time>{formatLocalDate(attempt.completed_at)}</time>
    </article>
  );
}
