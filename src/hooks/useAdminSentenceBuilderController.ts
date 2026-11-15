import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { getPageItems, getPageMetadata } from "@/lib/pagination";
import { useConfirmDialog } from "@/contexts/confirm-dialog";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { downloadCsvFile } from "@/lib/download-csv";
import {
  exportSentenceBuilderCsv,
  importSentenceBuilderQuestions,
  loadSentenceBuilderQuestions,
  parseSentenceBuilderCsv,
  removeSentenceBuilderQuestion,
  saveSentenceBuilderQuestion,
  type SentenceBuilderQuestion,
  type SentenceDifficulty,
  type SentenceQuestionInput,
} from "@/lib/supabase/sentence-builder";

const empty: SentenceQuestionInput = { question_id: "", difficulty: "easy", category: "", prompt_vi: "", answer_sentence: "", answer_tokens: [], distractor_tokens: [], image_keyword: "", vocabulary_words: [], is_active: true };

export function useAdminSentenceBuilderController() {
  const [questions, setQuestions] = useState<SentenceBuilderQuestion[]>([]);
  const [draft, setDraft] = useState<SentenceQuestionInput>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<SentenceDifficulty | "all">("all");
  const [pageSize, setPageSize] = useState<50 | 100>(50);
  const [page, setPage] = useState(1);
  const fileRef = useRef<HTMLInputElement>(null);
  const confirm = useConfirmDialog();
  const supabase = useSupabaseClient();
  const filteredQuestions = useMemo(() => filter === "all" ? questions : questions.filter((question) => question.difficulty === filter), [filter, questions]);
  const pageMetadata = getPageMetadata(filteredQuestions.length, page, pageSize);
  const visible = getPageItems(filteredQuestions, pageMetadata.currentPage, pageSize);
  const categoryOptions = [...new Set([...questions.map((question) => question.category), draft.category].map((name) => name.trim()).filter(Boolean))].sort((left, right) => left.localeCompare(right));

  async function refresh() {
    setLoading(true);
    try { setQuestions(await loadSentenceBuilderQuestions(false)); }
    catch { toast.error("Could not load Sentence Builder questions."); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    let active = true;
    void loadSentenceBuilderQuestions(false).then((data) => { if (active) setQuestions(data); })
      .catch(() => { if (active) toast.error("Could not load Sentence Builder questions."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function editQuestion(question: SentenceBuilderQuestion) {
    setEditing(question.id);
    setDraft({ ...question, answer_tokens: [...question.answer_tokens], distractor_tokens: [...question.distractor_tokens], vocabulary_words: [...question.vocabulary_words] });
    document.getElementById("sentence-builder-editor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function cancelEdit() {
    setEditing(null);
    setDraft(empty);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const input: SentenceQuestionInput = { ...draft, question_id: draft.question_id.trim(), category: draft.category.trim(), prompt_vi: draft.prompt_vi.trim(), answer_sentence: draft.answer_sentence.trim(), image_keyword: draft.image_keyword.trim() };
    if (!input.question_id || !input.category || !input.prompt_vi || !input.answer_sentence || input.answer_tokens.length < 2) { toast.error("Complete the required fields and add at least two answer tokens."); return; }
    setBusy(true);
    try {
      const { error } = await saveSentenceBuilderQuestion(
        supabase,
        editing,
        input,
        new Date().toISOString()
      );
      if (error) throw error;
      toast.success(editing ? "Question updated." : "Question added.");
      setDraft(empty); setEditing(null); await refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save this question."); }
    finally { setBusy(false); }
  }

  async function removeQuestion(question: SentenceBuilderQuestion) {
    const confirmed = await confirm({ title: "Remove sentence question?", description: `Remove ${question.question_id} (“${question.answer_sentence}”)?`, confirmLabel: "Remove" });
    if (!confirmed) return;
    const { error } = await removeSentenceBuilderQuestion(supabase, question.id);
    if (error) toast.error("Could not remove this question."); else { toast.success("Question removed."); await refresh(); }
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
    } catch (error) { toast.error(error instanceof Error ? error.message : "CSV import failed."); }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  async function exportCsv() {
    try {
      const rows = await loadSentenceBuilderQuestions(false);
      downloadCsvFile(
        "BlueWords_Sentence_Builder_Questions.csv",
        exportSentenceBuilderCsv(rows),
        { includeUtf8Bom: true }
      );
    } catch { toast.error("Could not export questions."); }
  }

  return {
    questions, draft, setDraft, editing, loading, busy, filter, setFilter,
    pageSize, setPageSize, setPage, fileRef, filteredQuestions,
    pageCount: pageMetadata.pageCount, currentPage: pageMetadata.currentPage,
    visible, categoryOptions, refresh, editQuestion, cancelEdit,
    save, removeQuestion, importCsv, exportCsv,
  };
}
