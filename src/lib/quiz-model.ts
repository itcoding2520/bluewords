import type { VocabularyWord } from "@/data/vocabulary";

export type QuizMode = "type-word" | "choose-meaning";
export type QuizPhase = "setup" | "playing" | "results";
export type QuizTab = "play" | "history";
export type QuizSaveState = "idle" | "saving" | "saved" | "error";
export const QUIZ_QUESTION_COUNTS = [10, 20, 30] as const;
export const MIN_QUIZ_QUESTION_COUNT = QUIZ_QUESTION_COUNTS[0];

export function getQuizQuestionProgress(questionIndex: number, questionCount: number) {
  const currentQuestion = questionCount > 0 ? questionIndex + 1 : 0;
  return {
    currentQuestion,
    percentage: questionCount > 0 ? (currentQuestion / questionCount) * 100 : 0,
  };
}

export function getQuizAdvanceLabel(questionIndex: number, questionCount: number): string {
  return getQuizQuestionProgress(questionIndex, questionCount).currentQuestion === questionCount
    ? "See results"
    : "Next question";
}

export interface QuizQuestion {
  word: VocabularyWord;
  meaning: string;
  partOfSpeech: string | null;
  choices: string[];
  choiceType: "meaning" | "word";
  correctAnswer: string;
}

export interface QuizAnswer {
  value: string;
  correct: boolean;
}
