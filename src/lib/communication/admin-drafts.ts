import type { CommunicationTopicDraft } from "@/components/admin/AdminCommunicationTopicForm";
import type { CommunicationLessonDraft } from "@/components/admin/AdminCommunicationLessonForm";
import type { CommunicationItemDraft } from "@/components/admin/AdminCommunicationItemForm";

export function createCommunicationTopicDraft(sortOrder = 1): CommunicationTopicDraft {
  return {
    slug: "",
    title_en: "",
    title_vi: "",
    description_en: "",
    description_vi: "",
    sort_order: sortOrder,
    status: "draft",
  };
}

export function createCommunicationLessonDraft(
  overrides: Partial<CommunicationLessonDraft> = {},
): CommunicationLessonDraft {
  return {
    topic_id: "",
    lesson_key: "",
    title_en: "",
    title_vi: "",
    difficulty: "easy",
    sort_order: 1,
    status: "draft",
    ...overrides,
  };
}

export function createCommunicationItemDraft(
  overrides: Partial<CommunicationItemDraft> = {},
): CommunicationItemDraft {
  return {
    lesson_id: "",
    item_key: "",
    item_type: "word",
    content_en: "",
    meaning_vi: "",
    example_en: "",
    example_vi: "",
    image_keyword: "",
    audio_url: "",
    sort_order: 1,
    ...overrides,
  };
}
