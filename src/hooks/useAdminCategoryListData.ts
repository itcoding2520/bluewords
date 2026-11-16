import { getErrorMessage } from "@/lib/errors";
import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@/lib/supabase/client";
import { invalidateAdminDataCache } from "@/lib/admin-data-cache.mjs";
import { loadAdminCategories } from "@/lib/admin-category-data";
import type { CommunityCategory } from "@/lib/admin-category-data";
import { scheduleDeferredTask } from "@/lib/schedule-deferred-task";


export function useAdminCategoryListData(supabase: SupabaseClient) {
  const [snapshot, setSnapshot] = useState<{
    categories: CommunityCategory[];
    emails: Record<string, string>;
  }>({ categories: [], emails: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { categories: communityCategories, emails } = snapshot;

  const refresh = useCallback(async (force = true) => {
    setLoading(true);
    setError("");
    if (force) invalidateAdminDataCache();
    try {
      const result = await loadAdminCategories(supabase, force);
      setSnapshot(result);
    } catch (cause) {
      setError(getErrorMessage(cause, "Could not load categories."));
      setSnapshot({ categories: [], emails: {} });
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    return scheduleDeferredTask(() => { void refresh(false); });
  }, [refresh]);

  return { communityCategories, emails, loading, error, setError, refresh };
}
