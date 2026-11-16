import type { Dispatch, SetStateAction } from "react";
import type { SupabaseClient } from "@/lib/supabase/client";
import { removeAdminSharedCategory, updateAdminSharedCategory } from "@/lib/admin-category-api";
import type { CommunityCategory } from "@/lib/admin-category-data";
import { useConfirmedAdminAction } from "@/hooks/useConfirmedAdminAction";

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
  async function editSharedCategory(category: CommunityCategory) {
    const name = window.prompt("Category name", category.name)?.trim();
    if (!name || name === category.name) return;
    const updateError = await updateAdminSharedCategory(supabase, category.id, name);
    if (updateError) setError(updateError.message);
    else await refresh();
  }

  const removeSharedCategory = useConfirmedAdminAction({
    confirmation: (category: CommunityCategory) => ({
      title: "Remove category?",
      description: `Remove “${category.name}” and its published words?`,
      confirmLabel: "Remove",
    }),
    run: (category: CommunityCategory) => removeAdminSharedCategory(supabase, category.id),
    onError: (error) => setError(error.message),
    onSuccess: async () => {
      setSelectedId("");
      await refresh();
    },
  });

  return { editSharedCategory, removeSharedCategory };
}
