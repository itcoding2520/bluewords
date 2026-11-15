import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { getPageItems, getPageMetadata } from "@/lib/pagination";
import { loadSentenceBuilderQuestions } from "@/lib/supabase/sentence-builder";
import { useAdminSentenceBuilderActions } from "@/hooks/useAdminSentenceBuilderActions";
import type {
  SentenceBuilderQuestion,
  SentenceDifficulty,
  SentenceQuestionInput,
} from "@/lib/sentence-builder";

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

  const actions = useAdminSentenceBuilderActions({
    draft,
    editing,
    busy,
    setBusy,
    resetDraft: () => setDraft(empty),
    setEditing,
    fileRef,
    refresh,
  });

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

  return {
    questions, draft, setDraft, editing, loading, busy, filter, setFilter,
    pageSize, setPageSize, setPage, fileRef, filteredQuestions,
    pageCount: pageMetadata.pageCount, currentPage: pageMetadata.currentPage,
    visible, categoryOptions, refresh, editQuestion, cancelEdit,
    ...actions,
  };
}
