import { CheckCircle2, Clock3, XCircle } from "lucide-react";

import { formatDuration } from "@/lib/assignments/format-duration";
import { formatLocalDate } from "@/lib/formatDate";
import type { AssessmentSummary } from "@/lib/assignments/types";

export function AssessmentResultSummary({
  assessment,
  passed,
  score,
  correctCount,
  elapsedSeconds,
  completedAt,
}: {
  assessment: AssessmentSummary | null;
  passed: boolean;
  score: number;
  correctCount: number;
  elapsedSeconds: number;
  completedAt: string;
}) {
  return (
    <>
      <header className={`assessment-score-hero ${passed ? "passed" : "failed"}`}>
        <span>{passed ? <CheckCircle2 /> : <XCircle />}{passed ? "Completed — You passed!" : "Not passed yet — Try again"}</span>
        <h1>{assessment?.title ?? "Assessment result"} · {assessment?.difficulty}</h1>
        <p>{passed ? "Great work. You completed this assigned test." : "You need more than 50 points to pass. Review the answers and try again."}</p>
        <div className="assessment-score-number"><strong>{score}</strong><span>/ 100 points</span></div>
      </header>

      <section className="assessment-result-stats">
        <div><CheckCircle2 /><strong>{correctCount}</strong><span>Correct</span></div>
        <div><XCircle /><strong>{10 - correctCount}</strong><span>Incorrect</span></div>
        <div><Clock3 /><strong>{formatDuration(elapsedSeconds)}</strong><span>Time taken</span></div>
        <div><strong>{formatLocalDate(completedAt)}</strong><span>Completed</span></div>
      </section>
    </>
  );
}
