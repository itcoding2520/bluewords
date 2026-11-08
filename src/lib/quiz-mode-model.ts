import type { QuizMode } from "@/lib/quiz-model";

export const QUIZ_MODE_OPTIONS: Record<QuizMode, {
  label: string;
  compactLabel: string;
  description: string;
}> = {
  "choose-meaning": {
    label: "Choose the meaning",
    compactLabel: "Choose meaning",
    description: "Match a word or meaning with the correct answer from four choices.",
  },
  "type-word": {
    label: "Type the word",
    compactLabel: "Type word",
    description: "Look at an image and type the vocabulary word.",
  },
};

export function quizModeLabel(mode: QuizMode): string {
  return QUIZ_MODE_OPTIONS[mode].label;
}
