import type { Dispatch, SetStateAction } from "react";

import { expectedAnswer, shuffle, type QuizAnswer, type QuizMode, type QuizPhase, type QuizQuestion } from "@/lib/quiz-model";
import { normalizeQuizAnswer } from "@/lib/supabase/normalize-quiz-answer.mjs";
import type { VocabularyWord } from "@/data/vocabulary";

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
  setPhase,
  setQuestions,
  setQuestionIndex,
  setAnswers,
  setInput,
  setStartedAt,
  setElapsedSeconds,
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
  setPhase: Dispatch<SetStateAction<QuizPhase>>;
  setQuestions: Dispatch<SetStateAction<QuizQuestion[]>>;
  setQuestionIndex: Dispatch<SetStateAction<number>>;
  setAnswers: Dispatch<SetStateAction<Record<number, QuizAnswer>>>;
  setInput: Dispatch<SetStateAction<string>>;
  setStartedAt: Dispatch<SetStateAction<number | null>>;
  setElapsedSeconds: Dispatch<SetStateAction<number>>;
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
    setQuestions(nextQuestions);
    setQuestionIndex(0);
    setAnswers({});
    setInput("");
    setElapsedSeconds(0);
    setStartedAt(now);
    resetSaveState();
    setPhase("playing");
    showPlayTab();
  }

  function submitAnswer(value: string) {
    const currentQuestion = questions[questionIndex];
    if (!currentQuestion || currentAnswer || !value.trim()) return;
    const expected = expectedAnswer(currentQuestion, mode);
    if (typeof expected !== "string" || !expected.trim()) return;

    setAnswers((previous) => ({
      ...previous,
      [questionIndex]: {
        value: value.trim(),
        correct: normalizeQuizAnswer(value) === normalizeQuizAnswer(expected),
      },
    }));
  }

  function goToNextQuestion() {
    if (questionIndex + 1 >= questions.length) {
      setElapsedSeconds(startedAt === null ? elapsedSeconds : Math.floor((Date.now() - startedAt) / 1000));
      setPhase("results");
      return;
    }
    setQuestionIndex((index) => index + 1);
    setInput("");
  }

  return { startQuiz, submitAnswer, goToNextQuestion };
}
