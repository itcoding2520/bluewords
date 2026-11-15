export const DIFFICULTY_LEVELS = ["easy", "medium", "hard"] as const;

export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];
