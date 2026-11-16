import type { Dispatch, SetStateAction } from "react";
import { useConfirmDialog } from "@/contexts/confirm-dialog";
import { invalidateAdminDataCache } from "@/lib/admin-data-cache.mjs";
import { removeAdminSharedWord, updateAdminSharedWord } from "@/lib/admin-category-api";
import type { CommunityWord } from "@/lib/admin-category-data";
import type { SupabaseClient } from "@/lib/supabase/client";

export function useAdminSharedWordActions({
  supabase,
  setError,
  setWords,
}: {
  supabase: SupabaseClient;
  setError: (error: string) => void;
  setWords: Dispatch<SetStateAction<CommunityWord[]>>;
}) {
  const confirmDialog = useConfirmDialog();

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

  return { editSharedWord, removeSharedWord };
}
