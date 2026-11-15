import type { Dispatch, FormEvent, RefObject, SetStateAction } from "react";
import { toast } from "sonner";
import { useConfirmDialog } from "@/contexts/confirm-dialog";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { downloadCsvFile } from "@/lib/download-csv";
import {
  importSentenceBuilderQuestions,
  loadSentenceBuilderQuestions,
  removeSentenceBuilderQuestion,
  saveSentenceBuilderQuestion,
} from "@/lib/supabase/sentence-builder";
import { exportSentenceBuilderCsv, parseSentenceBuilderCsv } from "@/lib/sentence-builder-csv";
import type { SentenceBuilderQuestion, SentenceQuestionInput } from "@/lib/sentence-builder";

export function useAdminSentenceBuilderActions({
  draft,
  editing,
  busy,
  setBusy,
  resetDraft,
  setEditing,
  fileRef,
  refresh,
}: {
  draft: SentenceQuestionInput;
  editing: string | null;
  busy: boolean;
  setBusy: Dispatch<SetStateAction<boolean>>;
  resetDraft: () => void;
  setEditing: Dispatch<SetStateAction<string | null>>;
  fileRef: RefObject<HTMLInputElement | null>;
  refresh: () => Promise<void>;
}) {
  const supabase = useSupabaseClient();
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

  async function importCsv(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const rows = parseSentenceBuilderCsv(await file.text());
      const { error } = await importSentenceBuilderQuestions(supabase, rows);
      if (error) throw error;
      toast.success(`Imported ${rows.length} questions.`);
      await refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "CSV import failed.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function exportCsv() {
    try {
      const rows = await loadSentenceBuilderQuestions(false);
      downloadCsvFile(
        "BlueWords_Sentence_Builder_Questions.csv",
        exportSentenceBuilderCsv(rows),
        { includeUtf8Bom: true }
      );
    } catch {
      toast.error("Could not export questions.");
    }
  }

  return { save, removeQuestion, importCsv, exportCsv };
}
