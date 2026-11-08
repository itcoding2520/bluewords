"use client";

import { useState } from "react";

import { useVocabulary } from "@/contexts/VocabularyContext";
import { useQuizConfiguration } from "@/hooks/useQuizConfiguration";
import { useQuizNavigation } from "@/hooks/useQuizNavigation";
import { useQuizProgression } from "@/hooks/useQuizProgression";
import { useQuizRoundActions } from "@/hooks/useQuizRoundActions";
import { useQuizSessionSave } from "@/hooks/useQuizSessionSave";
import { useQuizSetupData } from "@/hooks/useQuizSetupData";
import { useVocabularyQuizHistory } from "@/hooks/useVocabularyQuizHistory";
import type { QuizAnswer, QuizPhase, QuizQuestion } from "@/lib/quiz-model";

/** Owns the quiz page state and coordinates setup, play, results, and history. */
export function useQuizExperience(userId: string | null) {
  const { words, categories, isLoaded } = useVocabulary();
  const history = useVocabularyQuizHistory(userId);
  const configuration = useQuizConfiguration();
  const [phase, setPhase] = useState<QuizPhase>("setup");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, QuizAnswer>>({});
  const [input, setInput] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const navigation = useQuizNavigation({
    setPhase,
    setStartedAt,
    setSelectedHistory: history.setSelectedHistory,
    loadHistory: history.loadHistory,
  });
  const setup = useQuizSetupData({
    words,
    categories,
    category: configuration.category,
    mode: configuration.mode,
  });
  const currentQuestion = questions[questionIndex];
  const currentAnswer = answers[questionIndex];
  const correctCount = Object.values(answers).filter((answer) => answer.correct).length;
  const save = useQuizSessionSave({
    userId,
    phase,
    startedAt,
    mode: configuration.mode,
    questions,
    answers,
    correctCount,
    historyPageSize: history.historyPageSize,
    setHistoryPage: history.setHistoryPage,
    setElapsedSeconds,
    loadHistory: history.loadHistory,
  });
  useQuizProgression({
    phase,
    startedAt,
    currentAnswerIsCorrect: currentAnswer?.correct === true,
    questionIndex,
    questionCount: questions.length,
    setElapsedSeconds,
    setPhase,
    setQuestionIndex,
    setInput,
  });
  const round = useQuizRoundActions({
    mode: configuration.mode,
    maximumQuestions: setup.maximumQuestions,
    selectedQuestionCount: configuration.questionCount,
    eligibleWords: setup.eligibleWords,
    meaningQuestions: setup.meaningQuestions,
    questions,
    questionIndex,
    currentAnswer,
    startedAt,
    elapsedSeconds,
    setPhase,
    setQuestions,
    setQuestionIndex,
    setAnswers,
    setInput,
    setStartedAt,
    setElapsedSeconds,
    resetSaveState: save.resetSaveState,
    showPlayTab: navigation.showPlayTab,
  });

  return {
    isLoaded,
    phase,
    tab: navigation.tab,
    navigation,
    configuration,
    setup,
    history,
    round,
    currentQuestion,
    currentAnswer,
    questions,
    questionIndex,
    answers,
    correctCount,
    input,
    setInput,
    elapsedSeconds,
    save,
  };
}
