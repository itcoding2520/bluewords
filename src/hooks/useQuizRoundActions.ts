import { useCallback, type Dispatch } from "react";

import { type QuizAnswer, type QuizMode, type QuizQuestion } from "@/lib/quiz-model";
import { buildQuizAnswer } from "@/lib/quiz-answer-model";
import { buildQuizRoundQuestions } from "@/lib/quiz-round-model";
import { getQuizElapsedSeconds } from "@/lib/quiz-timing";
import type { VocabularyWord } from "@/data/vocabulary";
import type { QuizSessionAction } from "@/lib/quiz-session-state";

export function useQuizRoundActions({
  mode,
  maximumQuestions,
  selectedQuestionCount,
  eligibleWords,
  meaningQuestions,
  questions,
  questionIndex,
  currentAnswer,
  startedAt,
  elapsedSeconds,
  dispatch,
  resetSaveState,
  showPlayTab,
}: {
  mode: QuizMode;
  maximumQuestions: number;
  selectedQuestionCount: number;
  eligibleWords: VocabularyWord[];
  meaningQuestions: QuizQuestion[];
  questions: QuizQuestion[];
  questionIndex: number;
  currentAnswer?: QuizAnswer;
  startedAt: number | null;
  elapsedSeconds: number;
  dispatch: Dispatch<QuizSessionAction>;
  resetSaveState: () => void;
  showPlayTab: () => void;
}) {
  const startQuiz = useCallback(() => {
    if (maximumQuestions < selectedQuestionCount) return;
    const nextQuestions = buildQuizRoundQuestions({
      mode,
      eligibleWords,
      meaningQuestions,
      questionCount: selectedQuestionCount,
    });
    if (!nextQuestions) return;

    const now = Date.now();
    dispatch({ type: "start", questions: nextQuestions, startedAt: now });
    resetSaveState();
    showPlayTab();
  }, [dispatch, eligibleWords, maximumQuestions, meaningQuestions, mode, resetSaveState, selectedQuestionCount, showPlayTab]);

  const submitAnswer = useCallback((value: string) => {
    const currentQuestion = questions[questionIndex];
    if (!currentQuestion || currentAnswer) return;
    const answer = buildQuizAnswer(currentQuestion, mode, value);
    if (!answer) return;

    dispatch({
      type: "answer",
      questionIndex,
      answer,
    });
  }, [currentAnswer, dispatch, mode, questionIndex, questions]);

  const goToNextQuestion = useCallback(() => {
    dispatch({ type: "advance", elapsedSeconds: getQuizElapsedSeconds(startedAt, elapsedSeconds) });
  }, [dispatch, elapsedSeconds, startedAt]);

  return { startQuiz, submitAnswer, goToNextQuestion };
}
