import { useCallback, useEffect, useState } from "react";

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

const normalizeAnswer = (value: string) => value.trim().toLowerCase().replace(/\s+([.,!?])/g, "$1").replace(/\s+/g, " ");

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
    return normalizeAnswer(answer) === normalizeAnswer(expected);
  }

  return { attempt, error, isCorrectAnswer };
}
