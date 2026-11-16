import { useConfirmedAdminAction } from "@/hooks/useConfirmedAdminAction";
import type { SupabaseClient } from "@/lib/supabase/client";
import type { PublishedCategory, PublishedWord } from "@/lib/admin-review-types";
import {
  editPublishedCategory as editPublishedCategoryRecord,
  editPublishedWord as editPublishedWordRecord,
  removePublishedAdminReview,
} from "@/lib/admin-published-vocabulary-api";


export function useAdminPublishedVocabularyActions(
  supabase: SupabaseClient,
  setError: (error: string) => void,
  refresh: () => Promise<void>
) {
  type PublishedItem = { table: "community_categories" | "community_words"; item: PublishedCategory | PublishedWord };
  const removePublished = useConfirmedAdminAction<PublishedItem>({
    confirmation: ({ item }) => {
      const label = "name" in item ? item.name : item.word;
      return {
        title: "Remove published item?",
        description: `Remove “${label}” from the published vocabulary?`,
        confirmLabel: "Remove",
      };
    },
    run: ({ table, item }) => removePublishedAdminReview(supabase, table, item.id),
    onError: (error) => setError(error.message),
    onSuccess: refresh,
  });

  function handleRemovePublished(
    table: PublishedItem["table"],
    item: PublishedItem["item"],
  ) {
    return removePublished({ table, item });
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
    removePublished: handleRemovePublished,
    editPublishedWord,
    editPublishedCategory,
  };
}
