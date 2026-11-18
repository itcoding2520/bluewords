import { shuffle, shuffleAndTake } from "@/lib/random";
import type { DifficultyLevel } from "@/types/difficulty";

export type LessonDifficulty = DifficultyLevel;

export function createAnswerChoices(correctAnswer: string, distractors: string[]) {
  return shuffle([...new Set([correctAnswer, ...shuffleAndTake(distractors, 3)])]);
}

export function getCorrectReviewIntervalDays(reviewCount: number, correctCount: number, difficulty: LessonDifficulty) {
  if (correctCount <= 1) return 1;

  const accuracy = correctCount / Math.max(reviewCount, 1);
  const schedule = accuracy >= 0.9
    ? [1, 3, 7, 14, 21, 30]
    : accuracy >= 0.7
      ? [1, 2, 4, 7, 10, 14]
      : [1, 1, 2, 3, 5, 7];
  const baseDays = schedule[Math.min(correctCount - 1, schedule.length - 1)];

  if (difficulty === "easy") return Math.ceil(baseDays * 1.2);
  if (difficulty === "hard") return Math.max(1, Math.floor(baseDays * 0.7));
  return baseDays;
}

export function normalizeSentence(value: string) {
  return value.trim().replace(/\s+/g, " ").replace(/\s+([.,!?;:])/g, "$1").toLocaleLowerCase();
}
