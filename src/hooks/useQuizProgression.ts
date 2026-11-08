import { useEffect, type Dispatch } from "react";
import type { QuizPhase } from "@/lib/quiz-model";
import type { QuizSessionAction } from "@/lib/quiz-session-state";
import { getQuizElapsedSeconds } from "@/lib/quiz-timing";

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

    const tick = () => dispatch({ type: "tick", elapsedSeconds: getQuizElapsedSeconds(startedAt, 0) });
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [dispatch, phase, startedAt]);

  useEffect(() => {
    if (phase !== "playing" || !currentAnswerIsCorrect) return;

    const timeout = window.setTimeout(() => {
      dispatch({
        type: "advance",
        elapsedSeconds: getQuizElapsedSeconds(startedAt, 0),
      });
    }, 800);

    return () => window.clearTimeout(timeout);
  }, [currentAnswerIsCorrect, dispatch, phase, startedAt]);
}
