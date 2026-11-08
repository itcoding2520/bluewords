import { useCallback, useReducer } from "react";

import { initialQuizSessionState, quizSessionReducer } from "@/lib/quiz-session-state";

/** Owns transient quiz-round state and provides the selectors used by the page. */
export function useQuizSessionState() {
  const [session, dispatch] = useReducer(quizSessionReducer, initialQuizSessionState);
  const setInput = useCallback((value: string) => dispatch({ type: "input", value }), []);
  const setElapsedSeconds = useCallback((elapsedSeconds: number) => dispatch({ type: "elapsed", elapsedSeconds }), []);
  const exitQuiz = useCallback(() => dispatch({ type: "exit" }), []);
  const currentQuestion = session.questions[session.questionIndex];
  const currentAnswer = session.answers[session.questionIndex];
  const correctCount = Object.values(session.answers).filter((answer) => answer.correct).length;

  return {
    session,
    dispatch,
    setInput,
    setElapsedSeconds,
    exitQuiz,
    currentQuestion,
    currentAnswer,
    correctCount,
  };
}
