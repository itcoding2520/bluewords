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
