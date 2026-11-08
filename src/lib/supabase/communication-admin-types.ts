import type { CommunicationDifficulty, ContentStatus } from "@/lib/supabase/situational-english";

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
  item_type: "word" | "phrase" | "sentence_pattern";
  content_en: string;
  meaning_vi: string;
  example_en: string;
  example_vi: string;
  image_keyword: string;
  audio_url: string;
  sort_order: number;
};

export type CommunicationCollections = {
  topics: CommunicationTopic[];
  lessons: CommunicationLesson[];
  items: CommunicationLessonItem[];
};
