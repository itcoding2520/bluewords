"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { formatDuration } from "@/lib/assignments/format-duration";
import { formatLocalDate } from "@/lib/formatDate";
import { useAssessmentReviewController } from "@/hooks/useAssessmentReviewController";
import { AssessmentReviewAnswers } from "@/components/assignments/AssessmentReviewAnswers";

export function AssessmentReview({ attemptId }: { attemptId: string }) {
  const { attempt, error, isCorrectAnswer } = useAssessmentReviewController(attemptId);
  if (error) return <p role="alert" className="assessment-error">{error}</p>;
  if (!attempt) return <p className="assessment-loading">Loading your result…</p>;
  const recipient = Array.isArray(attempt.assessment_recipients) ? attempt.assessment_recipients[0] : attempt.assessment_recipients;
  const assessment = recipient ? (Array.isArray(recipient.assessments) ? recipient.assessments[0] : recipient.assessments) : null;
  const passed = attempt.score > 50;
  return <div className="assessment-review-page">
    <Link className="assessment-back-link" href="/assignments"><ArrowLeft size={17} /> Back to my assignments</Link>
    <header className={`assessment-score-hero ${passed ? "passed" : "failed"}`}><span>{passed ? <CheckCircle2 /> : <XCircle />}{passed ? "Completed — You passed!" : "Not passed yet — Try again"}</span><h1>{assessment?.title ?? "Assessment result"} · {assessment?.difficulty}</h1><p>{passed ? "Great work. You completed this assigned test." : "You need more than 50 points to pass. Review the answers and try again."}</p><div className="assessment-score-number"><strong>{attempt.score}</strong><span>/ 100 points</span></div></header>
    <section className="assessment-result-stats"><div><CheckCircle2 /><strong>{attempt.correct_count}</strong><span>Correct</span></div><div><XCircle /><strong>{10 - attempt.correct_count}</strong><span>Incorrect</span></div><div><Clock3 /><strong>{formatDuration(attempt.elapsed_seconds)}</strong><span>Time taken</span></div><div><strong>{formatLocalDate(attempt.completed_at)}</strong><span>Completed</span></div></section>
    <AssessmentReviewAnswers
      questions={attempt.questions}
      answers={attempt.answers}
      isCorrectAnswer={isCorrectAnswer}
    />
    {!passed && <Link className="assessment-retry-button" href="/assignments">Try again</Link>}
  </div>;
}
