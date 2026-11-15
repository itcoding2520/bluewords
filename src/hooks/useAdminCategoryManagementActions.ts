import type { Dispatch, SetStateAction } from "react";
import { useConfirmDialog } from "@/contexts/confirm-dialog";
import type { SupabaseClient } from "@/lib/supabase/client";
import { invalidateAdminDataCache } from "@/lib/admin-data-cache.mjs";
import {
  removeAdminSharedCategory,
  removeAdminSharedWord,
  updateAdminSharedCategory,
  updateAdminSharedWord,
} from "@/lib/admin-category-api";
import type { CommunityCategory, CommunityWord } from "@/lib/admin-category-data";


interface UseAdminCategoryManagementActionsOptions {
  supabase: SupabaseClient;
  setError: (error: string) => void;
  refresh: (force?: boolean) => Promise<void>;
  setSelectedId: Dispatch<SetStateAction<string>>;
  setWords: Dispatch<SetStateAction<CommunityWord[]>>;
}

export function useAdminCategoryManagementActions({
  supabase,
  setError,
  refresh,
  setSelectedId,
  setWords,
}: UseAdminCategoryManagementActionsOptions) {
  const confirmDialog = useConfirmDialog();

  async function editSharedCategory(category: CommunityCategory) {
    const name = window.prompt("Category name", category.name)?.trim();
    if (!name || name === category.name) return;
    const updateError = await updateAdminSharedCategory(supabase, category.id, name);
    if (updateError) setError(updateError.message);
    else await refresh();
  }

  async function removeSharedCategory(category: CommunityCategory) {
    const confirmed = await confirmDialog({
      title: "Remove category?",
      description: `Remove “${category.name}” and its published words?`,
      confirmLabel: "Remove",
    });
    if (!confirmed) return;
    const deleteError = await removeAdminSharedCategory(supabase, category.id);
    if (deleteError) setError(deleteError.message);
    else {
      setSelectedId("");
      await refresh();
    }
  }

  async function editSharedWord(word: CommunityWord) {
    const nextWord = window.prompt("Word", word.word)?.trim();
    if (!nextWord) return;
    const meaning = window.prompt("Meaning", word.meaning)?.trim();
    if (meaning == null || (nextWord === word.word && meaning === word.meaning)) return;
    const updateError = await updateAdminSharedWord(supabase, word.id, nextWord, meaning);
    if (updateError) setError(updateError.message);
    else {
      invalidateAdminDataCache();
      setWords((current) => current.map((item) => item.id === word.id
        ? { ...item, word: nextWord, meaning }
        : item));
    }
  }

  async function removeSharedWord(word: CommunityWord) {
    const confirmed = await confirmDialog({
      title: "Remove word?",
      description: `Remove “${word.word}” from this category?`,
      confirmLabel: "Remove",
    });
    if (!confirmed) return;
    const deleteError = await removeAdminSharedWord(supabase, word.id);
    if (deleteError) setError(deleteError.message);
    else {
      invalidateAdminDataCache();
      setWords((current) => current.filter((item) => item.id !== word.id));
    }
  }

  return {
    editSharedCategory,
    removeSharedCategory,
    editSharedWord,
    removeSharedWord,
  };
}
