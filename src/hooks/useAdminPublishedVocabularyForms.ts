import { useState } from "react";
import type { SupabaseClient } from "@/lib/supabase/client";
import {
  createPublishedCategory,
  createPublishedWord,
} from "@/lib/admin-published-vocabulary-api";

export function useAdminPublishedVocabularyForms(
  supabase: SupabaseClient,
  setError: (error: string) => void,
  refresh: () => Promise<void>
) {
  const [newCategory, setNewCategory] = useState("");
  const [newWord, setNewWord] = useState("");
  const [newMeaning, setNewMeaning] = useState("");
  const [newWordCategory, setNewWordCategory] = useState("");

  async function addPublishedCategory() {
    const name = newCategory.trim();
    if (!name) return;
    const result = await createPublishedCategory(supabase, name);
    if (!result.authenticated) return;
    if (result.error) {
      setError(result.error.code === "23505" ? "That category already exists." : result.error.message);
    } else {
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
    if (result.error) {
      setError(result.error.code === "23505" ? "That word already exists in this category." : result.error.message);
    } else {
      setNewWord("");
      setNewMeaning("");
      await refresh();
    }
  }

  return {
    newCategory,
    setNewCategory,
    newWord,
    setNewWord,
    newMeaning,
    setNewMeaning,
    newWordCategory,
    setNewWordCategory,
    addPublishedCategory,
    addPublishedWord,
  };
}
