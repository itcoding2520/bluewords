import { getErrorMessage } from "@/lib/errors";
import { useCallback, useEffect, useState } from "react";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { getAdminCachedData, invalidateAdminDataCache } from "@/lib/admin-data-cache.mjs";
import { loadAdminReviewSnapshot } from "@/lib/admin-review-api";
import type { AdminReviewSubmission, PublishedCategory, PublishedWord } from "@/lib/admin-review-types";
export type { AdminReviewSubmission, PublishedCategory, PublishedWord } from "@/lib/admin-review-types";

export function useAdminReviewData() {
  const supabase = useSupabaseClient();
  const [categories, setCategories] = useState<AdminReviewSubmission[]>([]);
  const [words, setWords] = useState<AdminReviewSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [publishedCategories, setPublishedCategories] = useState<PublishedCategory[]>([]);
  const [publishedWords, setPublishedWords] = useState<PublishedWord[]>([]);
  const [ownerEmails, setOwnerEmails] = useState<Record<string, string>>({});

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
      setCategories(result.categories);
      setWords(result.words);
      setPublishedCategories(result.publishedCategories);
      setPublishedWords(result.publishedWords);
      setOwnerEmails(result.ownerEmails);
    } catch (cause) {
      setError(getErrorMessage(cause, "Could not load requests."));
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(false); }, 0);
    return () => window.clearTimeout(timer);
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
