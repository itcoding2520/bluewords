export const LEARNING_STATUSES = ["learning", "mastered"] as const;

export type LearningStatus = (typeof LEARNING_STATUSES)[number];

export function isLearningStatus(value: unknown): value is LearningStatus {
  return typeof value === "string" && LEARNING_STATUSES.some((status) => status === value);
}
