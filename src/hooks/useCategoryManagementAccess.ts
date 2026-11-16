import { useEffect, useState } from "react";
import type { SupabaseClient } from "@/lib/supabase/client";
import { checkCurrentUserIsAdmin, loadPublishedCategoryAuthors } from "@/lib/category-management-api";
import { scheduleDeferredTask } from "@/lib/schedule-deferred-task";


export function useCategoryManagementAccess(supabase: SupabaseClient) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [categoryAuthors, setCategoryAuthors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const cancelScheduledCheck = scheduleDeferredTask(() => {
      void (async () => {
        const hasAdminAccess = await checkCurrentUserIsAdmin(supabase);
        if (!cancelled) setIsAdmin(hasAdminAccess);
      })();
    });
    return () => {
      cancelled = true;
      cancelScheduledCheck();
    };
  }, [supabase]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    const cancelScheduledLoad = scheduleDeferredTask(() => {
      void (async () => {
        const authors = await loadPublishedCategoryAuthors(supabase);
        if (!cancelled) setCategoryAuthors(authors);
      })();
    });
    return () => {
      cancelled = true;
      cancelScheduledLoad();
    };
  }, [isAdmin, supabase]);

  return { isAdmin, categoryAuthors };
}
