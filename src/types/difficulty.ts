export const DIFFICULTY_LEVELS = ["easy", "medium", "hard"] as const;

export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

export function isDifficultyLevel(value: unknown): value is DifficultyLevel {
  return typeof value === "string" && DIFFICULTY_LEVELS.some((level) => level === value);
}
