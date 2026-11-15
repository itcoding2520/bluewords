import { getErrorMessage } from "@/lib/errors";
import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@/lib/supabase/client";
import { invalidateAdminDataCache } from "@/lib/admin-data-cache.mjs";
import { loadAdminCategories } from "@/lib/admin-category-data";
import type { CommunityCategory } from "@/lib/admin-category-data";


export function useAdminCategoryListData(supabase: SupabaseClient) {
  const [communityCategories, setCommunityCategories] = useState<CommunityCategory[]>([]);
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async (force = true) => {
    setLoading(true);
    setError("");
    if (force) invalidateAdminDataCache();
    try {
      const result = await loadAdminCategories(supabase, force);
      setCommunityCategories(result.categories);
      setEmails(result.emails);
    } catch (cause) {
      setError(getErrorMessage(cause, "Could not load categories."));
      setCommunityCategories([]);
      setEmails({});
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(false); }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  return { communityCategories, emails, loading, error, setError, refresh };
}
