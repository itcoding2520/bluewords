import type { QuizAnswer, QuizMode, QuizQuestion } from "@/lib/quiz-model";
import { expectedAnswer } from "@/lib/quiz-model";
import { normalizeQuizAnswer } from "@/lib/supabase/normalize-quiz-answer.mjs";

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
