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
import { useAdminCommunicationDraftState } from "@/hooks/useAdminCommunicationDraftState";
import type { CommunicationTopic } from "@/lib/supabase/communication-admin-types";

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
  const [busy, setBusy] = useState(false);
  const [topicSearch, setTopicSearch] = useState("");
  const drafts = useAdminCommunicationDraftState({
    topicCount: topics.length,
    selectedTopicId,
    selectedLessonId,
  });

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
    setLessonDraft: drafts.setLessonDraft,
    setLessonEditing: drafts.setLessonEditing,
    setItemDraft: drafts.setItemDraft,
    setItemEditing: drafts.setItemEditing,
  });

  const { saveTopic, editTopic, removeTopic } = useAdminCommunicationTopicActions({
    supabase,
    topics,
    draft: drafts.topicDraft,
    editingId: drafts.topicEditing,
    setDraft: drafts.setTopicDraft,
    setEditingId: drafts.setTopicEditing,
    setBusy,
    refresh,
  });
  const { saveLesson, editLesson, removeLesson } = useAdminCommunicationLessonActions({
    supabase,
    topics,
    selectedTopicId,
    lessonCount: currentLessons.length,
    draft: drafts.lessonDraft,
    editingId: drafts.lessonEditing,
    setSelectedLessonId,
    setDraft: drafts.setLessonDraft,
    setEditingId: drafts.setLessonEditing,
    setBusy,
    refresh,
  });
  const { saveItem, editItem, removeItem } = useAdminCommunicationItemActions({
    supabase,
    lessons,
    selectedLessonId,
    itemCount: currentItems.length,
    draft: drafts.itemDraft,
    editingId: drafts.itemEditing,
    setDraft: drafts.setItemDraft,
    setEditingId: drafts.setItemEditing,
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
    onLessonsDeleted: drafts.resetAfterLessonsDeleted,
    onItemsDeleted: drafts.resetAfterItemsDeleted,
    refresh,
  });

  const {
    filteredTopics,
    lessonCountsByTopic,
    itemCountsByLesson,
    topicWordCounts,
  } = useAdminCommunicationTopicView({ topics, lessons, items, search: topicSearch });

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
    data: {
      topics,
      lessons,
      items,
      loading,
      currentTopic,
      currentLessons,
      currentItems,
      filteredTopics,
      lessonCountsByTopic,
      itemCountsByLesson,
      topicWordCounts,
      selectedLessonTitle: selectedLesson?.title_en ?? null,
    },
    selection: {
      selectedTopicId,
      selectedLessonId,
      topicSearch,
      setTopicSearch,
      selectTopic,
      selectLesson,
    },
    drafts: {
      topicDraft: drafts.topicDraft,
      topicEditing: drafts.topicEditing,
      lessonDraft: drafts.lessonDraft,
      lessonEditing: drafts.lessonEditing,
      itemDraft: drafts.itemDraft,
      itemEditing: drafts.itemEditing,
      setTopicDraft: drafts.setTopicDraft,
      setLessonDraft: drafts.setLessonDraft,
      setItemDraft: drafts.setItemDraft,
      cancelTopicEdit: drafts.cancelTopicEdit,
      cancelLessonEdit: drafts.cancelLessonEdit,
      cancelItemEdit: drafts.cancelItemEdit,
    },
    actions: {
      refresh,
      busy,
      setBusy,
      editTopic,
      editLesson,
      editItem,
      removeLesson,
      removeItem,
      removeAllLessons,
      removeAllItems,
      submitTopic,
      submitLesson,
      submitItem,
      removeTopicFromList,
    },
  };
}
