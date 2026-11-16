import { getErrorMessage } from "@/lib/errors";
import { useCallback, useEffect, useState } from "react";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { getAdminCachedData, invalidateAdminDataCache } from "@/lib/admin-data-cache.mjs";
import { loadAdminReviewSnapshot } from "@/lib/admin-review-api";
import { scheduleDeferredTask } from "@/lib/schedule-deferred-task";
import { useStateField } from "@/hooks/useStateField";
export type { AdminReviewSubmission, PublishedCategory, PublishedWord } from "@/lib/admin-review-types";

type AdminReviewSnapshot = Awaited<ReturnType<typeof loadAdminReviewSnapshot>>;

export function useAdminReviewData() {
  const supabase = useSupabaseClient();
  const [snapshot, setSnapshot] = useState<AdminReviewSnapshot>({
    categories: [],
    words: [],
    publishedCategories: [],
    publishedWords: [],
    ownerEmails: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { categories, words, publishedCategories, publishedWords, ownerEmails } = snapshot;
  const setCategories = useStateField(setSnapshot, "categories");
  const setWords = useStateField(setSnapshot, "words");
  const setPublishedCategories = useStateField(setSnapshot, "publishedCategories");
  const setPublishedWords = useStateField(setSnapshot, "publishedWords");

  const refresh = useCallback(async (force = true) => {
    setLoading(true);
    setError("");
    if (force) invalidateAdminDataCache();
    try {
      const result = await getAdminCachedData(
        "admin:review:all",
        () => loadAdminReviewSnapshot(supabase),
        { force }
      );
      setSnapshot(result);
    } catch (cause) {
      setError(getErrorMessage(cause, "Could not load requests."));
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    return scheduleDeferredTask(() => { void refresh(false); });
  }, [refresh]);

  return {
    categories,
    setCategories,
    words,
    setWords,
    loading,
    error,
    setError,
    publishedCategories,
    setPublishedCategories,
    publishedWords,
    setPublishedWords,
    ownerEmails,
    refresh,
  };
}
