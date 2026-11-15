import type { Dispatch, FormEvent, SetStateAction } from "react";
import { toast } from "sonner";
import { useConfirmDialog } from "@/contexts/confirm-dialog";
import type { SupabaseClient } from "@/lib/supabase/client";
import {
  removeSentenceBuilderQuestion,
  saveSentenceBuilderQuestion,
} from "@/lib/supabase/sentence-builder";
import type { SentenceBuilderQuestion, SentenceQuestionInput } from "@/lib/sentence-builder";

export function useAdminSentenceBuilderActions({
  supabase,
  draft,
  editing,
  busy,
  setBusy,
  resetDraft,
  setEditing,
  refresh,
}: {
  supabase: SupabaseClient;
  draft: SentenceQuestionInput;
  editing: string | null;
  busy: boolean;
  setBusy: Dispatch<SetStateAction<boolean>>;
  resetDraft: () => void;
  setEditing: Dispatch<SetStateAction<string | null>>;
  refresh: () => Promise<void>;
}) {
  const confirm = useConfirmDialog();

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const input: SentenceQuestionInput = {
      ...draft,
      question_id: draft.question_id.trim(),
      category: draft.category.trim(),
      prompt_vi: draft.prompt_vi.trim(),
      answer_sentence: draft.answer_sentence.trim(),
      image_keyword: draft.image_keyword.trim(),
    };
    if (!input.question_id || !input.category || !input.prompt_vi || !input.answer_sentence || input.answer_tokens.length < 2) {
      toast.error("Complete the required fields and add at least two answer tokens.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await saveSentenceBuilderQuestion(supabase, editing, input, new Date().toISOString());
      if (error) throw error;
      toast.success(editing ? "Question updated." : "Question added.");
      resetDraft();
      setEditing(null);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save this question.");
    } finally {
      setBusy(false);
    }
  }

  async function removeQuestion(question: SentenceBuilderQuestion) {
    const confirmed = await confirm({
      title: "Remove sentence question?",
      description: `Remove ${question.question_id} (“${question.answer_sentence}”)?`,
      confirmLabel: "Remove",
    });
    if (!confirmed) return;
    const { error } = await removeSentenceBuilderQuestion(supabase, question.id);
    if (error) toast.error("Could not remove this question.");
    else {
      toast.success("Question removed.");
      await refresh();
    }
  }

  return { save, removeQuestion };
}
