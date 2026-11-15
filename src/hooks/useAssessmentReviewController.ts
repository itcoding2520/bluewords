import { useCallback, useEffect, useState } from "react";
import { normalizeAssessmentAnswer } from "@/lib/assessments/normalize-answer";

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
      const response = await fetch(`/api/assessments/attempts/${attemptId}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not load result.");
      setAttempt(data.attempt);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load result.");
    }
  }, [attemptId]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function isCorrectAnswer(answer: string, expected: string) {
    return normalizeAssessmentAnswer(answer) === normalizeAssessmentAnswer(expected);
  }

  return { attempt, error, isCorrectAnswer };
}
