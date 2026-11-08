"use client";

import { useCallback, useReducer } from "react";

import { useVocabulary } from "@/contexts/VocabularyContext";
import { useQuizConfiguration } from "@/hooks/useQuizConfiguration";
import { useQuizNavigation } from "@/hooks/useQuizNavigation";
import { useQuizProgression } from "@/hooks/useQuizProgression";
import { useQuizRoundActions } from "@/hooks/useQuizRoundActions";
import { useQuizSessionSave } from "@/hooks/useQuizSessionSave";
import { useQuizSetupData } from "@/hooks/useQuizSetupData";
import { useVocabularyQuizHistory } from "@/hooks/useVocabularyQuizHistory";
import { initialQuizSessionState, quizSessionReducer } from "@/lib/quiz-session-state";

/** Owns the quiz page state and coordinates setup, play, results, and history. */
export function useQuizExperience(userId: string | null) {
  const { words, categories, isLoaded } = useVocabulary();
  const history = useVocabularyQuizHistory(userId);
  const configuration = useQuizConfiguration();
  const [session, dispatch] = useReducer(quizSessionReducer, initialQuizSessionState);
  const setInput = useCallback((value: string) => dispatch({ type: "input", value }), []);
  const setElapsedSeconds = useCallback((elapsedSeconds: number) => dispatch({ type: "tick", elapsedSeconds }), []);
  const exitQuiz = useCallback(() => dispatch({ type: "exit" }), []);
  const navigation = useQuizNavigation({
    exitQuiz,
    setSelectedHistory: history.setSelectedHistory,
    loadHistory: history.loadHistory,
  });
  const setup = useQuizSetupData({
    words,
    categories,
    category: configuration.category,
    mode: configuration.mode,
  });
  const currentQuestion = session.questions[session.questionIndex];
  const currentAnswer = session.answers[session.questionIndex];
  const correctCount = Object.values(session.answers).filter((answer) => answer.correct).length;
  const save = useQuizSessionSave({
    userId,
    phase: session.phase,
    startedAt: session.startedAt,
    mode: configuration.mode,
    questions: session.questions,
    answers: session.answers,
    correctCount,
    historyPageSize: history.historyPageSize,
    setHistoryPage: history.setHistoryPage,
    setElapsedSeconds,
    loadHistory: history.loadHistory,
  });
  useQuizProgression({
    phase: session.phase,
    startedAt: session.startedAt,
    currentAnswerIsCorrect: currentAnswer?.correct === true,
    dispatch,
  });
  const round = useQuizRoundActions({
    mode: configuration.mode,
    maximumQuestions: setup.maximumQuestions,
    selectedQuestionCount: configuration.questionCount,
    eligibleWords: setup.eligibleWords,
    meaningQuestions: setup.meaningQuestions,
    questions: session.questions,
    questionIndex: session.questionIndex,
    currentAnswer,
    startedAt: session.startedAt,
    elapsedSeconds: session.elapsedSeconds,
    dispatch,
    resetSaveState: save.resetSaveState,
    showPlayTab: navigation.showPlayTab,
  });

  return {
    isLoaded,
    phase: session.phase,
    tab: navigation.tab,
    navigation,
    configuration,
    setup,
    history,
    round,
    currentQuestion,
    currentAnswer,
    questions: session.questions,
    questionIndex: session.questionIndex,
    answers: session.answers,
    correctCount,
    input: session.input,
    setInput,
    elapsedSeconds: session.elapsedSeconds,
    save,
  };
}
