import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AssessmentQuestionForLearner } from "@/lib/assessments/types";
import { useElapsedTimer } from "@/hooks/useElapsedTimer";
import { fetchAssessmentAttempt, submitAssessmentAttempt } from "@/lib/assessments/api";

type AssessmentAttempt = { id: string; attempt_number: number; started_at: string; title: string; difficulty: string; questions: AssessmentQuestionForLearner[]; completed_at: string | null; answers: string[] };

export function useAssessmentRunnerController(attemptId: string) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<AssessmentAttempt | null>(null);
  const [answers, setAnswers] = useState<string[]>(Array(10).fill(""));
  const [sentenceTiles, setSentenceTiles] = useState<number[][]>(Array.from({ length: 10 }, () => []));
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
      const value = await fetchAssessmentAttempt<AssessmentAttempt>(attemptId, "Could not load test.");
      setAttempt(value);
      setAnswers(value.answers?.length === 10 ? value.answers : Array(10).fill(""));
      setSeconds(Math.max(0, Math.floor((Date.now() - new Date(value.started_at).getTime()) / 1000)));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load test.");
    } finally {
      setLoading(false);
    }
  }, [attemptId, setSeconds]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function setAnswer(index: number, value: string) {
    setAnswers((previous) => previous.map((answer, position) => position === index ? value : answer));
  }

  function toggleSentenceTile(questionIndex: number, tileIndex: number) {
    const question = attempt?.questions[questionIndex];
    if (question?.type !== "sentence") return;
    setSentenceTiles((previous) => {
      const next = previous.map((entry) => [...entry]);
      const currentSelection = next[questionIndex];
      if (currentSelection.includes(tileIndex)) next[questionIndex] = currentSelection.filter((entry) => entry !== tileIndex);
      else if (currentSelection.length < (question.tiles?.length ?? 0)) next[questionIndex] = [...currentSelection, tileIndex];
      const result = next[questionIndex].map((entry) => question.tiles?.[entry] ?? "").join(" ").replace(/\s+([.,!?])/g, "$1");
      setAnswers((old) => old.map((answer, position) => position === questionIndex ? result : answer));
      return next;
    });
  }

  function clearSentence(questionIndex: number) {
    setSentenceTiles((all) => all.map((entry, index) => index === questionIndex ? [] : entry));
    setAnswer(questionIndex, "");
  }

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
      setError(cause instanceof Error ? cause.message : "Could not submit test.");
      setSubmitting(false);
    }
  }

  return {
    attempt, answers, sentenceTiles, current, setCurrent, seconds, loading, submitting, error,
    load, setAnswer, toggleSentenceTile, clearSentence, submit,
  };
}
