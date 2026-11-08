import type { QuizAnswer, QuizMode, QuizQuestion } from "@/lib/quiz-model";
import { normalizeQuizAnswer } from "@/lib/supabase/normalize-quiz-answer.mjs";

export function expectedAnswer(question: QuizQuestion, mode: QuizMode): string {
  if (mode === "type-word" || question.choiceType === "word") return question.word.word;
  // Keep older in-memory quiz sessions answerable during development refreshes.
  return typeof question.correctAnswer === "string" ? question.correctAnswer : question.meaning;
}

export function promptText(question: QuizQuestion, mode: QuizMode): string {
  if (mode === "type-word") return "Image → Type the word";
  if (question.choiceType === "word") return "Meaning → Choose the word";
  return question.word.imagePath ? "Image → Choose the meaning" : "Word → Choose the meaning";
}

/** Build the submitted answer and correctness result, or null for unusable input. */
export function buildQuizAnswer(
  question: QuizQuestion,
  mode: QuizMode,
  value: string
): QuizAnswer | null {
  const normalizedValue = value.trim();
  if (!normalizedValue) return null;

  const expected = expectedAnswer(question, mode);
  if (typeof expected !== "string" || !expected.trim()) return null;

  return {
    value: normalizedValue,
    correct: normalizeQuizAnswer(value) === normalizeQuizAnswer(expected),
  };
}
