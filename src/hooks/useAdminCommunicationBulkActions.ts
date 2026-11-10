import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";

import { useConfirmDialog } from "@/components/ui/ConfirmDialogProvider";
import type { createClient } from "@/lib/supabase/client";

type SupabaseClient = ReturnType<typeof createClient>;

type Props = {
  supabase: SupabaseClient;
  selectedTopicId: string;
  topicTitle: string | null;
  lessonCount: number;
  selectedLessonId: string;
  lessonTitle: string | null;
  itemCount: number;
  setBusy: Dispatch<SetStateAction<boolean>>;
  onLessonsDeleted: () => void;
  onItemsDeleted: () => void;
  refresh: () => Promise<void>;
};

export function useAdminCommunicationBulkActions({
  supabase,
  selectedTopicId,
  topicTitle,
  lessonCount,
  selectedLessonId,
  lessonTitle,
  itemCount,
  setBusy,
  onLessonsDeleted,
  onItemsDeleted,
  refresh,
}: Props) {
  const confirm = useConfirmDialog();

  async function removeAllLessons() {
    if (!selectedTopicId || lessonCount === 0) return;
    const resolvedTopicTitle = topicTitle ?? "this situation";
    if (!await confirm({
      title: "Delete all lessons in this situation?",
      description: `Delete all ${lessonCount} lessons in “${resolvedTopicTitle}”, including their items, dialogues, learner review history, and progress? This cannot be undone.`,
      confirmLabel: "Delete all lessons",
    })) return;

    setBusy(true);
    const { error } = await supabase.from("communication_lessons").delete().eq("topic_id", selectedTopicId);
    setBusy(false);
    if (error) return toast.error(error.message);

    onLessonsDeleted();
    toast.success(`Deleted all lessons in “${resolvedTopicTitle}”.`);
    await refresh();
  }

  async function removeAllItems() {
    if (!selectedLessonId || itemCount === 0) return;
    const resolvedLessonTitle = lessonTitle ?? "this lesson";
    if (!await confirm({
      title: "Delete all items in this lesson?",
      description: `Delete all ${itemCount} vocabulary items from “${resolvedLessonTitle}”? Learners’ review data for these items will also be deleted.`,
      confirmLabel: "Delete all items",
    })) return;

    setBusy(true);
    const { error } = await supabase.from("communication_lesson_items").delete().eq("lesson_id", selectedLessonId);
    setBusy(false);
    if (error) return toast.error(error.message);

    onItemsDeleted();
    toast.success(`Deleted all items from “${resolvedLessonTitle}”.`);
    await refresh();
  }

  return { removeAllLessons, removeAllItems };
}
