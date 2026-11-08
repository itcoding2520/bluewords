import { useEffect, type Dispatch } from "react";
import type { QuizPhase } from "@/lib/quiz-model";
import type { QuizSessionAction } from "@/lib/quiz-session-state";

export function useQuizProgression({
  phase,
  startedAt,
  currentAnswerIsCorrect,
  dispatch,
}: {
  phase: QuizPhase;
  startedAt: number | null;
  currentAnswerIsCorrect: boolean;
  dispatch: Dispatch<QuizSessionAction>;
}) {
  useEffect(() => {
    if (phase !== "playing" || startedAt === null) return;

    const tick = () => dispatch({ type: "tick", elapsedSeconds: Math.floor((Date.now() - startedAt) / 1000) });
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [dispatch, phase, startedAt]);

  useEffect(() => {
    if (phase !== "playing" || !currentAnswerIsCorrect) return;

    const timeout = window.setTimeout(() => {
      dispatch({
        type: "advance",
        elapsedSeconds: startedAt === null ? 0 : Math.floor((Date.now() - startedAt) / 1000),
      });
    }, 800);

    return () => window.clearTimeout(timeout);
  }, [currentAnswerIsCorrect, dispatch, phase, startedAt]);
}
