import { useState } from "react";
import { useConfirmDialog } from "@/contexts/confirm-dialog";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { useAdminReviewData } from "@/hooks/useAdminReviewData";
import { useAdminReviewModeration } from "@/hooks/useAdminReviewModeration";
import type { PublishedCategory, PublishedWord } from "@/lib/admin-review-types";
import {
  createPublishedCategory,
  createPublishedWord,
  editPublishedCategory as editPublishedCategoryRecord,
  editPublishedWord as editPublishedWordRecord,
  removePublishedAdminReview,
} from "@/lib/admin-review-api";

export function useAdminReviewController() {
  const confirmDialog = useConfirmDialog();
  const supabase = useSupabaseClient();
  const reviewData = useAdminReviewData();
  const {
    categories,
    words,
    loading,
    error,
    setError,
    publishedCategories,
    publishedWords,
    ownerEmails,
    refresh,
  } = reviewData;
  const { busy, blockedWordId, moderate } = useAdminReviewModeration(supabase, reviewData);
  const [newCategory, setNewCategory] = useState("");
  const [newWord, setNewWord] = useState("");
  const [newMeaning, setNewMeaning] = useState("");
  const [newWordCategory, setNewWordCategory] = useState("");

  async function addPublishedCategory() {
    const name = newCategory.trim();
    if (!name) return;
    const result = await createPublishedCategory(supabase, name);
    if (!result.authenticated) return;
    const insertError = result.error;
    if (insertError) setError(insertError.code === "23505" ? "That category already exists." : insertError.message);
    else {
      setNewCategory("");
      await refresh();
    }
  }

  async function addPublishedWord() {
    const word = newWord.trim();
    if (!word || !newWordCategory) return;
    const result = await createPublishedWord(supabase, {
      categoryId: newWordCategory,
      word,
      meaning: newMeaning.trim(),
    });
    if (!result.authenticated) return;
    const insertError = result.error;
    if (insertError) setError(insertError.code === "23505" ? "That word already exists in this category." : insertError.message);
    else {
      setNewWord("");
      setNewMeaning("");
      await refresh();
    }
  }

  async function removePublished(
    table: "community_categories" | "community_words",
    item: PublishedCategory | PublishedWord
  ) {
    const label = "name" in item ? item.name : item.word;
    const confirmed = await confirmDialog({
      title: "Remove published item?",
      description: `Remove “${label}” from the published vocabulary?`,
      confirmLabel: "Remove",
    });
    if (!confirmed) return;
    const updateError = await removePublishedAdminReview(supabase, table, item.id);
    if (updateError) setError(updateError.message);
    else await refresh();
  }

  async function editPublishedWord(item: PublishedWord) {
    const word = window.prompt("Edit English word", item.word);
    if (word === null || !word.trim()) return;
    const meaning = window.prompt("Edit meaning", item.meaning);
    if (meaning === null) return;
    const updateError = await editPublishedWordRecord(
      supabase,
      item.id,
      word.trim(),
      meaning.trim()
    );
    if (updateError) setError(updateError.code === "23505"
      ? "A word with that spelling already exists in this category."
      : updateError.message);
    else await refresh();
  }

  async function editPublishedCategory(item: PublishedCategory) {
    const name = window.prompt("Edit category name", item.name);
    if (name === null || !name.trim()) return;
    const updateError = await editPublishedCategoryRecord(supabase, item.id, name.trim());
    if (updateError) setError(updateError.code === "23505"
      ? "A category with that name already exists."
      : updateError.message);
    else await refresh();
  }

  return {
    categories, words, loading, error, busy, blockedWordId,
    publishedCategories, publishedWords, ownerEmails,
    newCategory, setNewCategory, newWord, setNewWord,
    newMeaning, setNewMeaning, newWordCategory, setNewWordCategory,
    refresh, moderate, addPublishedCategory, addPublishedWord,
    removePublished, editPublishedWord, editPublishedCategory,
  };
}
