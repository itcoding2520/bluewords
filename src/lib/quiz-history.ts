import type { QuizMode } from "@/lib/quiz-model";

export function quizModeLabel(mode: QuizMode) {
  return mode === "type-word" ? "Type the word" : "Choose the meaning";
}
