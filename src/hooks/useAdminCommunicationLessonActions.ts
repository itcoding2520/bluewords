import type { Dispatch, FormEvent, SetStateAction } from "react";
import { toast } from "sonner";

import { useAdminCommunicationRemoveAction } from "@/hooks/useAdminCommunicationRemoveAction";
import type { CommunicationLessonDraft } from "@/lib/communication/admin-draft-types";
import { createCommunicationLessonDraft } from "@/lib/communication/admin-drafts";
import { removeCommunicationLesson, saveCommunicationLesson } from "@/lib/communication/admin-actions";
import type { SupabaseClient } from "@/lib/supabase/client";
import type { CommunicationLesson, CommunicationTopic } from "@/lib/supabase/communication-admin-types";


type Props = {
  supabase: SupabaseClient;
  topics: CommunicationTopic[];
  selectedTopicId: string;
  lessonCount: number;
  draft: CommunicationLessonDraft;
  editingId: string | null;
  setSelectedLessonId: Dispatch<SetStateAction<string>>;
  setDraft: Dispatch<SetStateAction<CommunicationLessonDraft>>;
  setEditingId: Dispatch<SetStateAction<string | null>>;
  setBusy: Dispatch<SetStateAction<boolean>>;
  refresh: () => Promise<void>;
};

export function useAdminCommunicationLessonActions({
  supabase,
  topics,
  selectedTopicId,
  lessonCount,
  draft,
  editingId,
  setSelectedLessonId,
  setDraft,
  setEditingId,
  setBusy,
  refresh,
}: Props) {
  async function saveLesson(event: FormEvent) {
    event.preventDefault();
    const payload = {
      ...draft,
      topic_id: selectedTopicId,
      lesson_key: draft.lesson_key.trim(),
      title_en: draft.title_en.trim(),
      title_vi: draft.title_vi.trim(),
    };
    if (!topics.some((topic) => topic.id === payload.topic_id) || !payload.lesson_key || !payload.title_en || !payload.title_vi) {
      return toast.error("Select an existing situation and complete the lesson key and titles.");
    }
    if (payload.lesson_key.length < 2 || payload.lesson_key.length > 80) {
      return toast.error("The lesson key must be between 2 and 80 characters.");
    }

    setBusy(true);
    const { error } = await saveCommunicationLesson(supabase, editingId, payload);
    setBusy(false);
    if (error) return toast.error(error.message);

    toast.success(editingId ? "Lesson updated." : "Lesson added.");
    setDraft(createCommunicationLessonDraft({ topic_id: selectedTopicId, sort_order: lessonCount + 1 }));
    setEditingId(null);
    await refresh();
  }

  function editLesson(lesson: CommunicationLesson) {
    setSelectedLessonId(lesson.id);
    setEditingId(lesson.id);
    setDraft({
      topic_id: lesson.topic_id,
      lesson_key: lesson.lesson_key,
      title_en: lesson.title_en,
      title_vi: lesson.title_vi,
      difficulty: lesson.difficulty,
      sort_order: lesson.sort_order,
      status: lesson.status,
    });
  }

  const removeLesson = useAdminCommunicationRemoveAction({
    title: "Remove lesson?",
    describe: (lesson: CommunicationLesson) => `Remove “${lesson.title_en}” and its items and dialogues?`,
    remove: (lesson: CommunicationLesson) => removeCommunicationLesson(supabase, lesson.id),
    successMessage: "Lesson removed.",
    refresh,
  });

  return { saveLesson, editLesson, removeLesson };
}
