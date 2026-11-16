import type { DifficultyLevel } from "@/types/difficulty";
import type { LearningStatus } from "@/types/learning";

export type LessonMode = "study" | "practice" | "drills" | "listening";
export const LESSON_ITEM_TYPES = ["word", "phrase", "sentence_pattern"] as const;
export type LessonItemType = (typeof LESSON_ITEM_TYPES)[number];

export function isLessonItemType(value: unknown): value is LessonItemType {
  return typeof value === "string" && LESSON_ITEM_TYPES.some((itemType) => itemType === value);
}

export type Lesson = {
  id: string;
  topic_id: string;
  title_en: string;
  title_vi: string;
  difficulty: DifficultyLevel;
  status: string;
};

export type Topic = {
  id: string;
  title_en: string;
  title_vi: string;
};

export type Item = {
  id: string;
  item_key: string;
  item_type: LessonItemType;
  content_en: string;
  meaning_vi: string;
  example_en: string;
  example_vi: string;
  image_keyword: string;
  audio_url: string;
  sort_order: number;
};

export type Dialogue = {
  id: string;
  title_en: string;
  title_vi: string;
  prompt_vi: string;
  sort_order: number;
};

export type Turn = {
  id: string;
  speaker: string;
  text_en: string;
  meaning_vi: string;
  audio_url: string;
  response_prompt_vi: string;
  expected_response: string;
  response_options: string[];
  turn_order: number;
};

export type ItemReview = {
  status: LearningStatus;
  review_count: number;
  correct_count: number;
};
