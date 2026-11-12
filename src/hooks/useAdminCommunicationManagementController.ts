import { useState } from "react";
import type { FormEvent } from "react";

import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { useAdminCommunicationCollections } from "@/hooks/useAdminCommunicationCollections";
import { useAdminCommunicationTopicActions } from "@/hooks/useAdminCommunicationTopicActions";
import { useAdminCommunicationLessonActions } from "@/hooks/useAdminCommunicationLessonActions";
import { useAdminCommunicationItemActions } from "@/hooks/useAdminCommunicationItemActions";
import { useAdminCommunicationBulkActions } from "@/hooks/useAdminCommunicationBulkActions";
import { useAdminCommunicationSelection } from "@/hooks/useAdminCommunicationSelection";
import { useAdminCommunicationTopicView } from "@/hooks/useAdminCommunicationTopicView";
import { createCommunicationItemDraft, createCommunicationLessonDraft, createCommunicationTopicDraft } from "@/lib/communication/admin-drafts";
import type { CommunicationTopic } from "@/lib/supabase/communication-admin-types";
import type { CommunicationTopicDraft } from "@/components/admin/AdminCommunicationTopicForm";
import type { CommunicationLessonDraft } from "@/components/admin/AdminCommunicationLessonForm";
import type { CommunicationItemDraft } from "@/components/admin/AdminCommunicationItemForm";

export function useAdminCommunicationManagementController() {
  const supabase = useSupabaseClient();
  const {
    topics,
    lessons,
    items,
    selectedTopicId,
    setSelectedTopicId,
    selectedLessonId,
    setSelectedLessonId,
    loading,
    refresh,
  } = useAdminCommunicationCollections(supabase);
  const [topicDraft, setTopicDraft] = useState<CommunicationTopicDraft>(createCommunicationTopicDraft);
  const [topicEditing, setTopicEditing] = useState<string | null>(null);
  const [lessonDraft, setLessonDraft] = useState<CommunicationLessonDraft>(createCommunicationLessonDraft);
  const [lessonEditing, setLessonEditing] = useState<string | null>(null);
  const [itemDraft, setItemDraft] = useState<CommunicationItemDraft>(createCommunicationItemDraft);
  const [itemEditing, setItemEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [topicSearch, setTopicSearch] = useState("");

  const {
    currentTopic,
    currentLessons,
    currentItems,
    selectTopic,
    selectLesson,
  } = useAdminCommunicationSelection({
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
  });

  const { saveTopic, editTopic, removeTopic } = useAdminCommunicationTopicActions({
    supabase,
    topics,
    draft: topicDraft,
    editingId: topicEditing,
    setDraft: setTopicDraft,
    setEditingId: setTopicEditing,
    setBusy,
    refresh,
  });
  const { saveLesson, editLesson, removeLesson } = useAdminCommunicationLessonActions({
    supabase,
    topics,
    selectedTopicId,
    lessonCount: currentLessons.length,
    draft: lessonDraft,
    editingId: lessonEditing,
    setSelectedLessonId,
    setDraft: setLessonDraft,
    setEditingId: setLessonEditing,
    setBusy,
    refresh,
  });
  const { saveItem, editItem, removeItem } = useAdminCommunicationItemActions({
    supabase,
    lessons,
    selectedLessonId,
    itemCount: currentItems.length,
    draft: itemDraft,
    editingId: itemEditing,
    setDraft: setItemDraft,
    setEditingId: setItemEditing,
    setBusy,
    refresh,
  });

  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId) ?? null;
  const { removeAllLessons, removeAllItems } = useAdminCommunicationBulkActions({
    supabase,
    selectedTopicId,
    topicTitle: currentTopic?.title_en ?? null,
    lessonCount: currentLessons.length,
    selectedLessonId,
    lessonTitle: selectedLesson?.title_en ?? null,
    itemCount: currentItems.length,
    setBusy,
    onLessonsDeleted: () => {
      setLessonEditing(null);
      setItemEditing(null);
      setLessonDraft(createCommunicationLessonDraft({ topic_id: selectedTopicId }));
      setItemDraft(createCommunicationItemDraft());
    },
    onItemsDeleted: () => {
      setItemEditing(null);
      setItemDraft(createCommunicationItemDraft({ lesson_id: selectedLessonId }));
    },
    refresh,
  });

  const { filteredTopics, topicWordCounts } = useAdminCommunicationTopicView({ topics, lessons, items, search: topicSearch });

  function cancelTopicEdit() {
    setTopicEditing(null);
    setTopicDraft(createCommunicationTopicDraft(topics.length + 1));
  }

  function cancelLessonEdit() {
    setLessonEditing(null);
    setLessonDraft(createCommunicationLessonDraft({ topic_id: selectedTopicId }));
  }

  function cancelItemEdit() {
    setItemEditing(null);
    setItemDraft(createCommunicationItemDraft({ lesson_id: selectedLessonId }));
  }

  function submitTopic(event: FormEvent<HTMLFormElement>) {
    void saveTopic(event);
  }

  function submitLesson(event: FormEvent<HTMLFormElement>) {
    void saveLesson(event);
  }

  function submitItem(event: FormEvent<HTMLFormElement>) {
    void saveItem(event);
  }

  function removeTopicFromList(topic: CommunicationTopic) {
    void removeTopic(topic);
  }

  return {
    supabase,
    topics,
    lessons,
    items,
    selectedTopicId,
    selectedLessonId,
    loading,
    refresh,
    busy,
    setBusy,
    topicDraft,
    topicEditing,
    lessonDraft,
    lessonEditing,
    itemDraft,
    itemEditing,
    topicSearch,
    currentTopic,
    currentLessons,
    currentItems,
    filteredTopics,
    topicWordCounts,
    selectedLessonTitle: selectedLesson?.title_en ?? null,
    setTopicDraft,
    setLessonDraft,
    setItemDraft,
    setTopicSearch,
    selectTopic,
    selectLesson,
    editTopic,
    editLesson,
    editItem,
    removeLesson,
    removeItem,
    removeAllLessons,
    removeAllItems,
    cancelTopicEdit,
    cancelLessonEdit,
    cancelItemEdit,
    submitTopic,
    submitLesson,
    submitItem,
    removeTopicFromList,
  };
}
