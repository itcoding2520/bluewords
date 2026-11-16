import type { DifficultyLevel } from "@/types/difficulty";

export type CommunicationDifficulty = DifficultyLevel;
export const CONTENT_STATUSES = ["draft", "published", "archived"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];
export type CommunicationRecordType = "item" | "dialogue_turn";

export function isContentStatus(value: unknown): value is ContentStatus {
  return typeof value === "string" && CONTENT_STATUSES.some((status) => status === value);
}
