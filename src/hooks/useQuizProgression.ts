import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { QuizPhase } from "@/lib/quiz-model";

export function useQuizProgression({
  phase,
  startedAt,
  currentAnswerIsCorrect,
  questionIndex,
  questionCount,
  setElapsedSeconds,
  setPhase,
  setQuestionIndex,
  setInput,
}: {
  phase: QuizPhase;
  startedAt: number | null;
  currentAnswerIsCorrect: boolean;
  questionIndex: number;
  questionCount: number;
  setElapsedSeconds: Dispatch<SetStateAction<number>>;
  setPhase: Dispatch<SetStateAction<QuizPhase>>;
  setQuestionIndex: Dispatch<SetStateAction<number>>;
  setInput: Dispatch<SetStateAction<string>>;
}) {
  useEffect(() => {
    if (phase !== "playing" || startedAt === null) return;

    const tick = () => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [phase, setElapsedSeconds, startedAt]);

  useEffect(() => {
    if (phase !== "playing" || !currentAnswerIsCorrect) return;

    const timeout = window.setTimeout(() => {
      if (questionIndex + 1 >= questionCount) {
        setElapsedSeconds(startedAt === null ? 0 : Math.floor((Date.now() - startedAt) / 1000));
        setPhase("results");
        return;
      }

      setQuestionIndex((index) => index + 1);
      setInput("");
    }, 800);

    return () => window.clearTimeout(timeout);
  }, [currentAnswerIsCorrect, phase, questionCount, questionIndex, setElapsedSeconds, setInput, setPhase, setQuestionIndex, startedAt]);
}
