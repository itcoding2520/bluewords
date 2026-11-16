import { getErrorMessage } from "@/lib/errors";
import { useCallback, useEffect, useState } from "react";
import type { AssessmentRunnerAttempt } from "@/lib/assessments/types";
import { useElapsedTimer } from "@/hooks/useElapsedTimer";
import { useAssessmentRunnerAnswers } from "@/hooks/useAssessmentRunnerAnswers";
import { fetchAssessmentAttempt } from "@/lib/assessments/api";
import { scheduleDeferredTask } from "@/lib/schedule-deferred-task";
import { useAssessmentRunnerSubmission } from "@/hooks/useAssessmentRunnerSubmission";
import { getDurationSeconds } from "@/lib/session-duration";

export function useAssessmentRunnerController(attemptId: string) {
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
  const [error, setError] = useState("");
  const { submitting, submit } = useAssessmentRunnerSubmission({
    attemptId,
    answers,
    setError,
  });

  const load = useCallback(async () => {
    try {
      const value = await fetchAssessmentAttempt<AssessmentRunnerAttempt>(attemptId, "Could not load test.");
      setAttempt(value);
      setAnswers(value.answers?.length === 10 ? value.answers : Array(10).fill(""));
      setSeconds(getDurationSeconds(new Date(value.started_at).getTime(), Date.now()));
    } catch (cause) {
      setError(getErrorMessage(cause, "Could not load test."));
    } finally {
      setLoading(false);
    }
  }, [attemptId, setAnswers, setSeconds]);

  useEffect(() => {
    return scheduleDeferredTask(() => { void load(); });
  }, [load]);

  return {
    test: { attempt, loading, error },
    progress: { current, setCurrent, seconds, submitting },
    answers: { answers, sentenceTiles, setAnswer, toggleSentenceTile, clearSentence },
    actions: { load, submit },
  };
}
