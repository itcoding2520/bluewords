import { useEffect, useState } from "react";
import { useConfirmDialog } from "@/contexts/confirm-dialog";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { invalidateAdminDataCache } from "@/lib/admin-data-cache.mjs";
import { useAdminReviewData } from "@/hooks/useAdminReviewData";
import type { PublishedCategory, PublishedWord } from "@/hooks/useAdminReviewData";

export function useAdminReviewController() {
  const confirmDialog = useConfirmDialog();
  const supabase = useSupabaseClient();
  const {
    categories,
    setCategories,
    words,
    setWords,
    loading,
    error,
    setError,
    publishedCategories,
    setPublishedCategories,
    publishedWords,
    setPublishedWords,
    ownerEmails,
    refresh,
  } = useAdminReviewData();
  const [busy, setBusy] = useState<string | null>(null);
  const [blockedWordId, setBlockedWordId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [newWord, setNewWord] = useState("");
  const [newMeaning, setNewMeaning] = useState("");
  const [newWordCategory, setNewWordCategory] = useState("");

  useEffect(() => {
    if (!blockedWordId) return;
    const timer = window.setTimeout(() => setBlockedWordId(null), 3000);
    return () => window.clearTimeout(timer);
  }, [blockedWordId]);

  async function moderate(
    table: "community_categories" | "community_words",
    id: string,
    status: "published" | "rejected"
  ) {
    if (table === "community_words" && status === "published") {
      const word = words.find((item) => item.id === id);
      if (word && word.category_status !== "published") {
        setBlockedWordId(id);
        return;
      }
    }
    setBlockedWordId(null);
    setBusy(id);
    setError("");
    try {
      const { error: updateError } = await supabase.from(table).update({ status }).eq("id", id);
      if (updateError) {
        setError(updateError.code === "23505"
          ? "A published category or word with that name already exists."
          : updateError.message);
        return;
      }

      invalidateAdminDataCache();
      if (table === "community_categories") {
        const category = categories.find((item) => item.id === id);
        setCategories((current) => current.filter((item) => item.id !== id));
        if (category && status === "published") {
          setPublishedCategories((current) => [...current.filter((item) => item.id !== id), {
            id: category.id,
            owner_id: category.owner_id,
            name: category.name ?? "",
            color: category.color ?? "blue",
            status: "published",
            image_path: category.image_path ?? null,
          }]);
        }
        setWords((current) => current.map((item) => item.category_id === id
          ? { ...item, category_status: status }
          : item));
      } else {
        const word = words.find((item) => item.id === id);
        setWords((current) => current.filter((item) => item.id !== id));
        if (word && status === "published" && word.category_id && word.word) {
          const publishedWord: PublishedWord = {
            id: word.id,
            owner_id: word.owner_id,
            category_id: word.category_id,
            word: word.word,
            meaning: word.meaning ?? "",
            status: "published",
            image_path: word.image_path ?? null,
          };
          setPublishedWords((current) => [...current.filter((item) => item.id !== id), publishedWord]);
        }
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update this request.");
    } finally {
      setBusy(null);
    }
  }

  async function addPublishedCategory() {
    const name = newCategory.trim();
    if (!name) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error: insertError } = await supabase.from("community_categories").insert({
      owner_id: user.id,
      name,
      color: "blue",
      status: "published",
    });
    if (insertError) setError(insertError.code === "23505" ? "That category already exists." : insertError.message);
    else {
      setNewCategory("");
      await refresh();
    }
  }

  async function addPublishedWord() {
    const word = newWord.trim();
    if (!word || !newWordCategory) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error: insertError } = await supabase.from("community_words").insert({
      owner_id: user.id,
      category_id: newWordCategory,
      word,
      meaning: newMeaning.trim(),
      status: "published",
    });
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
    const { error: updateError } = await supabase.from(table).update({ status: "removed" }).eq("id", item.id);
    if (updateError) setError(updateError.message);
    else await refresh();
  }

  async function editPublishedWord(item: PublishedWord) {
    const word = window.prompt("Edit English word", item.word);
    if (word === null || !word.trim()) return;
    const meaning = window.prompt("Edit meaning", item.meaning);
    if (meaning === null) return;
    const { error: updateError } = await supabase.from("community_words").update({
      word: word.trim(),
      meaning: meaning.trim(),
    }).eq("id", item.id);
    if (updateError) setError(updateError.code === "23505"
      ? "A word with that spelling already exists in this category."
      : updateError.message);
    else await refresh();
  }

  async function editPublishedCategory(item: PublishedCategory) {
    const name = window.prompt("Edit category name", item.name);
    if (name === null || !name.trim()) return;
    const { error: updateError } = await supabase.from("community_categories").update({
      name: name.trim(),
    }).eq("id", item.id);
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
