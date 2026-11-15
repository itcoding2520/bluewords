import { useEffect, useState } from "react";
import type { SupabaseClient } from "@/lib/supabase/client";
import { checkCurrentUserIsAdmin, loadPublishedCategoryAuthors } from "@/lib/category-management-api";


export function useCategoryManagementAccess(supabase: SupabaseClient) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [categoryAuthors, setCategoryAuthors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        const hasAdminAccess = await checkCurrentUserIsAdmin(supabase);
        if (!cancelled) setIsAdmin(hasAdminAccess);
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [supabase]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        const authors = await loadPublishedCategoryAuthors(supabase);
        if (!cancelled) setCategoryAuthors(authors);
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isAdmin, supabase]);

  return { isAdmin, categoryAuthors };
}
