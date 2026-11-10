import type { Dispatch, FormEvent, SetStateAction } from "react";
import { toast } from "sonner";

import { useConfirmDialog } from "@/components/ui/ConfirmDialogProvider";
import type { CommunicationItemDraft } from "@/components/admin/AdminCommunicationItemForm";
import type { createClient } from "@/lib/supabase/client";
import type { CommunicationLesson, CommunicationLessonItem } from "@/lib/supabase/communication-admin-types";

type SupabaseClient = ReturnType<typeof createClient>;

type Props = {
  supabase: SupabaseClient;
  lessons: CommunicationLesson[];
  selectedLessonId: string;
  itemCount: number;
  draft: CommunicationItemDraft;
  editingId: string | null;
  setDraft: Dispatch<SetStateAction<CommunicationItemDraft>>;
  setEditingId: Dispatch<SetStateAction<string | null>>;
  setBusy: Dispatch<SetStateAction<boolean>>;
  refresh: () => Promise<void>;
};

export function useAdminCommunicationItemActions({
  supabase,
  lessons,
  selectedLessonId,
  itemCount,
  draft,
  editingId,
  setDraft,
  setEditingId,
  setBusy,
  refresh,
}: Props) {
  const confirm = useConfirmDialog();

  async function saveItem(event: FormEvent) {
    event.preventDefault();
    const payload = {
      ...draft,
      lesson_id: selectedLessonId,
      item_key: draft.item_key.trim(),
      content_en: draft.content_en.trim(),
      meaning_vi: draft.meaning_vi.trim(),
    };

    if (!lessons.some((lesson) => lesson.id === payload.lesson_id) || !payload.item_key || !payload.content_en || !payload.meaning_vi) {
      return toast.error("Select an existing lesson and complete the item key, English content, and Vietnamese meaning.");
    }
    if (payload.item_key.length < 2 || payload.item_key.length > 100) {
      return toast.error("The item key must be between 2 and 100 characters.");
    }
    if (Boolean(payload.example_en.trim()) !== Boolean(payload.example_vi.trim())) {
      return toast.error("Provide both example translations, or leave both examples blank.");
    }
    if (payload.item_type === "sentence_pattern" && (!payload.example_en.trim() || !payload.example_vi.trim())) {
      return toast.error("Sentence patterns need an English example and its Vietnamese translation.");
    }
    if (!isOptionalHttpUrl(payload.audio_url)) {
      return toast.error("Audio URL must be a valid HTTP or HTTPS link.");
    }

    setBusy(true);
    const query = editingId
      ? supabase.from("communication_lesson_items").update(payload).eq("id", editingId)
      : supabase.from("communication_lesson_items").insert(payload);
    const { error } = await query;
    setBusy(false);
    if (error) return toast.error(error.message);

    toast.success(editingId ? "Learning item updated." : "Learning item added.");
    setDraft({ ...emptyItemDraft, lesson_id: selectedLessonId, sort_order: itemCount + 1 });
    setEditingId(null);
    await refresh();
  }

  function editItem(item: CommunicationLessonItem) {
    setEditingId(item.id);
    setDraft({
      lesson_id: item.lesson_id,
      item_key: item.item_key,
      item_type: item.item_type,
      content_en: item.content_en,
      meaning_vi: item.meaning_vi,
      example_en: item.example_en,
      example_vi: item.example_vi,
      image_keyword: item.image_keyword,
      audio_url: item.audio_url,
      sort_order: item.sort_order,
    });
  }

  async function removeItem(item: CommunicationLessonItem) {
    if (!await confirm({
      title: "Remove learning item?",
      description: `Remove “${item.content_en}” from this lesson?`,
      confirmLabel: "Remove",
    })) return;

    const { error } = await supabase.from("communication_lesson_items").delete().eq("id", item.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Learning item removed.");
    await refresh();
  }

  return { saveItem, editItem, removeItem };
}

function isOptionalHttpUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

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
