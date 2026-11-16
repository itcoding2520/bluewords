import { useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { CommunicationLessonDraft, CommunicationItemDraft } from "@/lib/communication/admin-draft-types";
import { createCommunicationItemDraft, createCommunicationLessonDraft } from "@/lib/communication/admin-drafts";
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
  const lessonsByTopic = useMemo(() => {
    const grouped = new Map<string, CommunicationLesson[]>();
    for (const lesson of lessons) {
      const topicLessons = grouped.get(lesson.topic_id);
      if (topicLessons) topicLessons.push(lesson);
      else grouped.set(lesson.topic_id, [lesson]);
    }
    return grouped;
  }, [lessons]);
  const itemsByLesson = useMemo(() => {
    const grouped = new Map<string, CommunicationLessonItem[]>();
    for (const item of items) {
      const lessonItems = grouped.get(item.lesson_id);
      if (lessonItems) lessonItems.push(item);
      else grouped.set(item.lesson_id, [item]);
    }
    return grouped;
  }, [items]);
  const currentTopic = topics.find((topic) => topic.id === selectedTopicId) ?? null;
  const currentLessons = lessonsByTopic.get(selectedTopicId) ?? [];
  const currentItems = itemsByLesson.get(selectedLessonId) ?? [];

  function selectTopic(topicId: string) {
    const firstLessonId = lessonsByTopic.get(topicId)?.[0]?.id ?? "";
    setSelectedTopicId(topicId);
    setSelectedLessonId(firstLessonId);
    setLessonEditing(null);
    setLessonDraft(createCommunicationLessonDraft({ topic_id: topicId }));
    setItemEditing(null);
    setItemDraft(createCommunicationItemDraft({ lesson_id: firstLessonId }));
  }

  function selectLesson(lesson: CommunicationLesson) {
    setSelectedLessonId(lesson.id);
    setItemDraft(createCommunicationItemDraft({ lesson_id: lesson.id }));
    setItemEditing(null);
  }

  return { currentTopic, currentLessons, currentItems, selectTopic, selectLesson };
}
