import type { CommunicationLessonItem, CommunicationLesson, CommunicationTopic } from "@/lib/supabase/communication-admin-types";

export type CommunicationTopicDraft = Pick<
  CommunicationTopic,
  "slug" | "title_en" | "title_vi" | "description_en" | "description_vi" | "sort_order" | "status"
>;

export type CommunicationLessonDraft = Omit<CommunicationLesson, "id">;
export type CommunicationItemDraft = Omit<CommunicationLessonItem, "id">;
