import type { Dispatch, SetStateAction } from "react";

import type { CommunicationLessonDraft } from "@/components/admin/AdminCommunicationLessonForm";
import type { CommunicationItemDraft } from "@/components/admin/AdminCommunicationItemForm";
import type {
  CommunicationLesson,
  CommunicationLessonItem,
  CommunicationTopic,
} from "@/lib/supabase/communication-admin-types";

type Props = {
  topics: CommunicationTopic[];
  lessons: CommunicationLesson[];
  items: CommunicationLessonItem[];
  selectedTopicId: string;
  setSelectedTopicId: Dispatch<SetStateAction<string>>;
  selectedLessonId: string;
  setSelectedLessonId: Dispatch<SetStateAction<string>>;
  setLessonDraft: Dispatch<SetStateAction<CommunicationLessonDraft>>;
  setLessonEditing: Dispatch<SetStateAction<string | null>>;
  setItemDraft: Dispatch<SetStateAction<CommunicationItemDraft>>;
  setItemEditing: Dispatch<SetStateAction<string | null>>;
};

export function useAdminCommunicationSelection({
  topics,
  lessons,
  items,
  selectedTopicId,
  setSelectedTopicId,
  selectedLessonId,
  setSelectedLessonId,
  setLessonDraft,
  setLessonEditing,
  setItemDraft,
  setItemEditing,
}: Props) {
  const currentTopic = topics.find((topic) => topic.id === selectedTopicId) ?? null;
  const currentLessons = lessons.filter((lesson) => lesson.topic_id === selectedTopicId);
  const currentItems = items.filter((item) => item.lesson_id === selectedLessonId);

  function selectTopic(topicId: string) {
    const firstLessonId = lessons.find((lesson) => lesson.topic_id === topicId)?.id ?? "";
    setSelectedTopicId(topicId);
    setSelectedLessonId(firstLessonId);
    setLessonEditing(null);
    setLessonDraft({ ...emptyLessonDraft, topic_id: topicId });
    setItemEditing(null);
    setItemDraft({ ...emptyItemDraft, lesson_id: firstLessonId });
  }

  function selectLesson(lesson: CommunicationLesson) {
    setSelectedLessonId(lesson.id);
    setItemDraft({ ...emptyItemDraft, lesson_id: lesson.id });
    setItemEditing(null);
  }

  return { currentTopic, currentLessons, currentItems, selectTopic, selectLesson };
}

const emptyLessonDraft: CommunicationLessonDraft = {
  topic_id: "",
  lesson_key: "",
  title_en: "",
  title_vi: "",
  difficulty: "easy",
  sort_order: 1,
  status: "draft",
};

const emptyItemDraft: CommunicationItemDraft = {
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
};
