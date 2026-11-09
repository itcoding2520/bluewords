import type { Dispatch, FormEvent, SetStateAction } from "react";
import { toast } from "sonner";

import { useConfirmDialog } from "@/components/ui/ConfirmDialogProvider";
import type { CommunicationTopicDraft } from "@/components/admin/AdminCommunicationTopicForm";
import type { createClient } from "@/lib/supabase/client";
import type { CommunicationTopic } from "@/lib/supabase/communication-admin-types";

type SupabaseClient = ReturnType<typeof createClient>;

type Props = {
  supabase: SupabaseClient;
  topics: CommunicationTopic[];
  draft: CommunicationTopicDraft;
  editingId: string | null;
  setDraft: Dispatch<SetStateAction<CommunicationTopicDraft>>;
  setEditingId: Dispatch<SetStateAction<string | null>>;
  setBusy: Dispatch<SetStateAction<boolean>>;
  refresh: () => Promise<void>;
};

export function useAdminCommunicationTopicActions({
  supabase,
  topics,
  draft,
  editingId,
  setDraft,
  setEditingId,
  setBusy,
  refresh,
}: Props) {
  const confirm = useConfirmDialog();

  async function saveTopic(event: FormEvent) {
    event.preventDefault();
    const payload = {
      ...draft,
      slug: draft.slug.trim().toLowerCase().replaceAll(" ", "-"),
      title_en: draft.title_en.trim(),
      title_vi: draft.title_vi.trim(),
    };
    if (!payload.slug || !payload.title_en || !payload.title_vi) {
      return toast.error("Add a stable slug and both topic titles.");
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug)) {
      return toast.error("Use lowercase letters, numbers, and single hyphens in the situation slug.");
    }

    setBusy(true);
    const query = editingId
      ? supabase.from("communication_topics").update(payload).eq("id", editingId)
      : supabase.from("communication_topics").insert(payload);
    const { error } = await query;
    setBusy(false);
    if (error) return toast.error(error.message);

    toast.success(editingId ? "Topic updated." : "Topic added.");
    setDraft({ slug: "", title_en: "", title_vi: "", description_en: "", description_vi: "", sort_order: topics.length + 1, status: "draft" });
    setEditingId(null);
    await refresh();
  }

  function editTopic(topic: CommunicationTopic) {
    setEditingId(topic.id);
    setDraft({
      slug: topic.slug,
      title_en: topic.title_en,
      title_vi: topic.title_vi,
      description_en: topic.description_en,
      description_vi: topic.description_vi,
      sort_order: topic.sort_order,
      status: topic.status,
    });
  }

  async function removeTopic(topic: CommunicationTopic) {
    if (!await confirm({
      title: "Remove situation?",
      description: `Remove “${topic.title_en}” and all its lessons and content?`,
      confirmLabel: "Remove",
    })) return;

    const { error } = await supabase.from("communication_topics").delete().eq("id", topic.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Situation removed.");
    await refresh();
  }

  return { saveTopic, editTopic, removeTopic };
}
