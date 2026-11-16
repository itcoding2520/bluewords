import { getErrorMessage } from "@/lib/errors";
import { useCallback, useEffect, useState } from "react";
import { areAssessmentAnswersEqual } from "@/lib/assessments/normalize-answer";
import { fetchAssessmentAttempt } from "@/lib/assessments/api";
import type { AssessmentReviewQuestion } from "@/lib/assessments/types";
import type { AssessmentSummary } from "@/lib/assignments/types";
import { firstRelation } from "@/lib/supabase/first-relation";
import { scheduleDeferredTask } from "@/lib/schedule-deferred-task";

type AssessmentRecipient = { assessments: AssessmentSummary | AssessmentSummary[] | null };
type AssessmentReviewAttempt = {
  id: string;
  attempt_number: number;
  questions: AssessmentReviewQuestion[];
  answers: string[];
  score: number;
  correct_count: number;
  elapsed_seconds: number;
  result: string;
  completed_at: string;
  assessment_recipients: AssessmentRecipient | AssessmentRecipient[] | null;
};

function getAssessmentSummary(attempt: AssessmentReviewAttempt | null): AssessmentSummary | null {
  if (!attempt) return null;
  const recipient = firstRelation(attempt.assessment_recipients);
  if (!recipient) return null;
  return firstRelation(recipient.assessments);
}

export function useAssessmentReviewController(attemptId: string) {
  const [attempt, setAttempt] = useState<AssessmentReviewAttempt | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const result = await fetchAssessmentAttempt<AssessmentReviewAttempt>(attemptId, "Could not load result.");
      setAttempt(result);
    } catch (cause) {
      setError(getErrorMessage(cause, "Could not load result."));
    }
  }, [attemptId]);

  useEffect(() => {
    return scheduleDeferredTask(() => { void load(); });
  }, [load]);

  return { attempt, assessment: getAssessmentSummary(attempt), error, isCorrectAnswer: areAssessmentAnswersEqual };
}
