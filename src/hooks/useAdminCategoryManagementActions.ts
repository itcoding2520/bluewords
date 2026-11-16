import type { Dispatch, SetStateAction } from "react";
import type { SupabaseClient } from "@/lib/supabase/client";
import type { CommunityWord } from "@/lib/admin-category-data";
import { useAdminSharedCategoryActions } from "@/hooks/useAdminSharedCategoryActions";
import { useAdminSharedWordActions } from "@/hooks/useAdminSharedWordActions";


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
  const categoryActions = useAdminSharedCategoryActions({ supabase, setError, refresh, setSelectedId });
  const wordActions = useAdminSharedWordActions({ supabase, setError, setWords });

  return {
    ...categoryActions,
    ...wordActions,
  };
}
