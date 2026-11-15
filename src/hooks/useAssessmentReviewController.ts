import { useCallback, useEffect, useState } from "react";
import { areAssessmentAnswersEqual } from "@/lib/assessments/normalize-answer";
import { fetchAssessmentAttempt } from "@/lib/assessments/api";

type ReviewQuestion = { type: "vocabulary" | "sentence"; prompt: string; answer: string; word?: string; meaning?: string };
type AssessmentSummary = { title: string; difficulty: string };
type AssessmentRecipient = { assessments: AssessmentSummary | AssessmentSummary[] };
type AssessmentReviewAttempt = {
  id: string;
  attempt_number: number;
  questions: ReviewQuestion[];
  answers: string[];
  score: number;
  correct_count: number;
  elapsed_seconds: number;
  result: string;
  completed_at: string;
  assessment_recipients: AssessmentRecipient | AssessmentRecipient[];
};

export function useAssessmentReviewController(attemptId: string) {
  const [attempt, setAttempt] = useState<AssessmentReviewAttempt | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const result = await fetchAssessmentAttempt<AssessmentReviewAttempt>(attemptId, "Could not load result.");
      setAttempt(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load result.");
    }
  }, [attemptId]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return { attempt, error, isCorrectAnswer: areAssessmentAnswersEqual };
}
