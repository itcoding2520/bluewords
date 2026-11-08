import type { Dispatch } from "react";

import { expectedAnswer, shuffle, type QuizAnswer, type QuizMode, type QuizQuestion } from "@/lib/quiz-model";
import { normalizeQuizAnswer } from "@/lib/supabase/normalize-quiz-answer.mjs";
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
  function startQuiz() {
    if (maximumQuestions < selectedQuestionCount) return;
    const pool = mode === "type-word"
      ? shuffle(eligibleWords).map((word) => ({ word, meaning: "", partOfSpeech: null, choices: [], choiceType: "word" as const, correctAnswer: word.word }))
      : shuffle(meaningQuestions);
    const nextQuestions = pool.slice(0, selectedQuestionCount);
    if (nextQuestions.length !== selectedQuestionCount) return;

    const now = Date.now();
    dispatch({ type: "start", questions: nextQuestions, startedAt: now });
    resetSaveState();
    showPlayTab();
  }

  function submitAnswer(value: string) {
    const currentQuestion = questions[questionIndex];
    if (!currentQuestion || currentAnswer || !value.trim()) return;
    const expected = expectedAnswer(currentQuestion, mode);
    if (typeof expected !== "string" || !expected.trim()) return;

    dispatch({
      type: "answer",
      questionIndex,
      answer: {
        value: value.trim(),
        correct: normalizeQuizAnswer(value) === normalizeQuizAnswer(expected),
      },
    });
  }

  function goToNextQuestion() {
    dispatch({ type: "advance", elapsedSeconds: getElapsedSeconds(startedAt, elapsedSeconds) });
  }

  return { startQuiz, submitAnswer, goToNextQuestion };
}

function getElapsedSeconds(startedAt: number | null, elapsedSeconds: number): number {
  return startedAt === null ? elapsedSeconds : Math.floor((Date.now() - startedAt) / 1000);
}
