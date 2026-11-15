import { useState } from "react";

import {
  createCommunicationItemDraft,
  createCommunicationLessonDraft,
  createCommunicationTopicDraft,
} from "@/lib/communication/admin-drafts";
import type {
  CommunicationItemDraft,
  CommunicationLessonDraft,
  CommunicationTopicDraft,
} from "@/lib/communication/admin-draft-types";

export function useAdminCommunicationDraftState({
  topicCount,
  selectedTopicId,
  selectedLessonId,
}: {
  topicCount: number;
  selectedTopicId: string;
  selectedLessonId: string;
}) {
  const [topicDraft, setTopicDraft] = useState<CommunicationTopicDraft>(createCommunicationTopicDraft);
  const [topicEditing, setTopicEditing] = useState<string | null>(null);
  const [lessonDraft, setLessonDraft] = useState<CommunicationLessonDraft>(createCommunicationLessonDraft);
  const [lessonEditing, setLessonEditing] = useState<string | null>(null);
  const [itemDraft, setItemDraft] = useState<CommunicationItemDraft>(createCommunicationItemDraft);
  const [itemEditing, setItemEditing] = useState<string | null>(null);

  function cancelTopicEdit() {
    setTopicEditing(null);
    setTopicDraft(createCommunicationTopicDraft(topicCount + 1));
  }

  function cancelLessonEdit() {
    setLessonEditing(null);
    setLessonDraft(createCommunicationLessonDraft({ topic_id: selectedTopicId }));
  }

  function cancelItemEdit() {
    setItemEditing(null);
    setItemDraft(createCommunicationItemDraft({ lesson_id: selectedLessonId }));
  }

  function resetAfterLessonsDeleted() {
    setLessonEditing(null);
    setItemEditing(null);
    setLessonDraft(createCommunicationLessonDraft({ topic_id: selectedTopicId }));
    setItemDraft(createCommunicationItemDraft());
  }

  function resetAfterItemsDeleted() {
    setItemEditing(null);
    setItemDraft(createCommunicationItemDraft({ lesson_id: selectedLessonId }));
  }

  return {
    topicDraft,
    topicEditing,
    lessonDraft,
    lessonEditing,
    itemDraft,
    itemEditing,
    setTopicDraft,
    setTopicEditing,
    setLessonDraft,
    setLessonEditing,
    setItemDraft,
    setItemEditing,
    cancelTopicEdit,
    cancelLessonEdit,
    cancelItemEdit,
    resetAfterLessonsDeleted,
    resetAfterItemsDeleted,
  };
}
