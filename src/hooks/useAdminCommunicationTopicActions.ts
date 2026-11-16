import type { Dispatch, FormEvent, SetStateAction } from "react";
import { toast } from "sonner";

import { useConfirmedAdminAction } from "@/hooks/useConfirmedAdminAction";
import type { CommunicationTopicDraft } from "@/lib/communication/admin-draft-types";
import { createCommunicationTopicDraft } from "@/lib/communication/admin-drafts";
import { removeCommunicationTopic, saveCommunicationTopic } from "@/lib/communication/admin-actions";
import type { SupabaseClient } from "@/lib/supabase/client";
import type { CommunicationTopic } from "@/lib/supabase/communication-admin-types";


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
    const { error } = await saveCommunicationTopic(supabase, editingId, payload);
    setBusy(false);
    if (error) return toast.error(error.message);

    toast.success(editingId ? "Topic updated." : "Topic added.");
    setDraft(createCommunicationTopicDraft(topics.length + 1));
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

  const removeTopic = useConfirmedAdminAction({
    confirmation: (topic: CommunicationTopic) => ({
      title: "Remove situation?",
      description: `Remove “${topic.title_en}” and all its lessons and content?`,
      confirmLabel: "Remove",
    }),
    run: (topic: CommunicationTopic) => removeCommunicationTopic(supabase, topic.id).then(({ error }) => error),
    onError: (error) => toast.error(error.message),
    onSuccess: async () => {
      toast.success("Situation removed.");
      await refresh();
    },
  });

  return { saveTopic, editTopic, removeTopic };
}
