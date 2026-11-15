import type { GamePhase } from "@/types/game";
import type { VocabularyWord } from "@/data/vocabulary";
import type { QuizMode } from "@/types/quiz";

export type { QuizMode };
export type QuizPhase = GamePhase;
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

export function isQuizLastQuestion(questionIndex: number, questionCount: number): boolean {
  return questionCount > 0 && questionIndex >= questionCount - 1;
}

export function getQuizAdvanceLabel(questionIndex: number, questionCount: number): string {
  return isQuizLastQuestion(questionIndex, questionCount)
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
