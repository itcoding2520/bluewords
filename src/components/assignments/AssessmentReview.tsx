"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAssessmentReviewController } from "@/hooks/useAssessmentReviewController";
import { AssessmentReviewAnswers } from "@/components/assignments/AssessmentReviewAnswers";
import { AssessmentResultSummary } from "@/components/assignments/AssessmentResultSummary";

export function AssessmentReview({ attemptId }: { attemptId: string }) {
  const { attempt, assessment, error, isCorrectAnswer } = useAssessmentReviewController(attemptId);
  if (error) return <p role="alert" className="assessment-error">{error}</p>;
  if (!attempt) return <p className="assessment-loading">Loading your result…</p>;
  const passed = attempt.score > 50;
  return <div className="assessment-review-page">
    <Link className="assessment-back-link" href="/assignments"><ArrowLeft size={17} /> Back to my assignments</Link>
    <AssessmentResultSummary
      assessment={assessment}
      passed={passed}
      score={attempt.score}
      correctCount={attempt.correct_count}
      elapsedSeconds={attempt.elapsed_seconds}
      completedAt={attempt.completed_at}
    />
    <AssessmentReviewAnswers
      questions={attempt.questions}
      answers={attempt.answers}
      isCorrectAnswer={isCorrectAnswer}
    />
    {!passed && <Link className="assessment-retry-button" href="/assignments">Try again</Link>}
  </div>;
}
