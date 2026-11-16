import type { CommunicationDifficulty, ContentStatus } from "@/lib/communication/content-types";
import type { LessonItemType } from "@/lib/communication/lesson-types";

export type CommunicationTopic = {
  id: string;
  slug: string;
  title_en: string;
  title_vi: string;
  description_en: string;
  description_vi: string;
  sort_order: number;
  status: ContentStatus;
};

export type CommunicationLesson = {
  id: string;
  topic_id: string;
  lesson_key: string;
  title_en: string;
  title_vi: string;
  difficulty: CommunicationDifficulty;
  sort_order: number;
  status: ContentStatus;
};

export type CommunicationLessonItem = {
  id: string;
  lesson_id: string;
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

export type CommunicationDialogue = {
  id: string;
  dialogue_key: string;
  lesson_id: string;
  title_en: string;
  title_vi: string;
  prompt_vi: string;
  sort_order: number;
};

export type CommunicationDialogueTurn = {
  id: string;
  turn_key: string;
  dialogue_id: string;
  turn_order: number;
  speaker: string;
  text_en: string;
  meaning_vi: string;
  audio_url: string;
  response_prompt_vi: string;
  expected_response: string;
  response_options: string[];
};

export type CommunicationCollections = {
  topics: CommunicationTopic[];
  lessons: CommunicationLesson[];
  items: CommunicationLessonItem[];
};
