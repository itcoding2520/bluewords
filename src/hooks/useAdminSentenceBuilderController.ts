import { useMemo, useRef, useState } from "react";
import { getPageItems, getPageMetadata } from "@/lib/pagination";
import { useAdminSentenceBuilderActions } from "@/hooks/useAdminSentenceBuilderActions";
import { useAdminSentenceBuilderData } from "@/hooks/useAdminSentenceBuilderData";
import type {
  SentenceBuilderQuestion,
  SentenceDifficulty,
  SentenceQuestionInput,
} from "@/lib/sentence-builder";

const empty: SentenceQuestionInput = { question_id: "", difficulty: "easy", category: "", prompt_vi: "", answer_sentence: "", answer_tokens: [], distractor_tokens: [], image_keyword: "", vocabulary_words: [], is_active: true };

export function useAdminSentenceBuilderController() {
  const { questions, loading, refresh } = useAdminSentenceBuilderData();
  const [draft, setDraft] = useState<SentenceQuestionInput>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<SentenceDifficulty | "all">("all");
  const [pageSize, setPageSize] = useState<50 | 100>(50);
  const [page, setPage] = useState(1);
  const fileRef = useRef<HTMLInputElement>(null);
  const filteredQuestions = useMemo(() => filter === "all" ? questions : questions.filter((question) => question.difficulty === filter), [filter, questions]);
  const pageMetadata = getPageMetadata(filteredQuestions.length, page, pageSize);
  const visible = getPageItems(filteredQuestions, pageMetadata.currentPage, pageSize);
  const categoryOptions = [...new Set([...questions.map((question) => question.category), draft.category].map((name) => name.trim()).filter(Boolean))].sort((left, right) => left.localeCompare(right));

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
