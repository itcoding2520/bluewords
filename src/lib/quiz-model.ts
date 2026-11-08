import type { VocabularyWord } from "@/data/vocabulary";

export type QuizMode = "type-word" | "choose-meaning";
export type QuizPhase = "setup" | "playing" | "results";
export type QuizTab = "play" | "history";
export type QuizSaveState = "idle" | "saving" | "saved" | "error";

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

export function formatQuizTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours ? `${hours}:` : ""}${String(minutes).padStart(hours ? 2 : 1, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
