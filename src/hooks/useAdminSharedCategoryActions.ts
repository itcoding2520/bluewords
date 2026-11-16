import type { Dispatch, SetStateAction } from "react";
import { useConfirmDialog } from "@/contexts/confirm-dialog";
import type { SupabaseClient } from "@/lib/supabase/client";
import { removeAdminSharedCategory, updateAdminSharedCategory } from "@/lib/admin-category-api";
import type { CommunityCategory } from "@/lib/admin-category-data";

export function useAdminSharedCategoryActions({
  supabase,
  setError,
  refresh,
  setSelectedId,
}: {
  supabase: SupabaseClient;
  setError: (error: string) => void;
  refresh: (force?: boolean) => Promise<void>;
  setSelectedId: Dispatch<SetStateAction<string>>;
}) {
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

  return { editSharedCategory, removeSharedCategory };
}
