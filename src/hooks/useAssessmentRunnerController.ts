import { getErrorMessage } from "@/lib/errors";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AssessmentRunnerAttempt } from "@/lib/assessments/types";
import { useElapsedTimer } from "@/hooks/useElapsedTimer";
import { useAssessmentRunnerAnswers } from "@/hooks/useAssessmentRunnerAnswers";
import { fetchAssessmentAttempt, submitAssessmentAttempt } from "@/lib/assessments/api";
import { scheduleDeferredTask } from "@/lib/schedule-deferred-task";

export function useAssessmentRunnerController(attemptId: string) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<AssessmentRunnerAttempt | null>(null);
  const { answers, setAnswers, sentenceTiles, setAnswer, toggleSentenceTile, clearSentence } =
    useAssessmentRunnerAnswers(attempt?.questions ?? []);
  const [current, setCurrent] = useState(0);
  const timerStartedAt = attempt ? new Date(attempt.started_at).getTime() : null;
  const { elapsedSeconds: seconds, setElapsedSeconds: setSeconds } = useElapsedTimer(
    timerStartedAt,
    Boolean(attempt && !attempt.completed_at)
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const value = await fetchAssessmentAttempt<AssessmentRunnerAttempt>(attemptId, "Could not load test.");
      setAttempt(value);
      setAnswers(value.answers?.length === 10 ? value.answers : Array(10).fill(""));
      setSeconds(Math.max(0, Math.floor((Date.now() - new Date(value.started_at).getTime()) / 1000)));
    } catch (cause) {
      setError(getErrorMessage(cause, "Could not load test."));
    } finally {
      setLoading(false);
    }
  }, [attemptId, setAnswers, setSeconds]);

  useEffect(() => {
    return scheduleDeferredTask(() => { void load(); });
  }, [load]);

  async function submit() {
    if (answers.some((answer) => !answer.trim())) {
      setError("Answer all 10 questions before submitting.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await submitAssessmentAttempt(attemptId, answers);
      router.replace(`/assignments/results/${attemptId}`);
    } catch (cause) {
      setError(getErrorMessage(cause, "Could not submit test."));
      setSubmitting(false);
    }
  }

  return {
    test: { attempt, loading, error },
    progress: { current, setCurrent, seconds, submitting },
    answers: { answers, sentenceTiles, setAnswer, toggleSentenceTile, clearSentence },
    actions: { load, submit },
  };
}
