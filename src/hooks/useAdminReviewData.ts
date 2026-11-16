import { getErrorMessage } from "@/lib/errors";
import { useCallback, useEffect, useState } from "react";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { getAdminCachedData, invalidateAdminDataCache } from "@/lib/admin-data-cache.mjs";
import { loadAdminReviewSnapshot } from "@/lib/admin-review-api";
import { scheduleDeferredTask } from "@/lib/schedule-deferred-task";
import { updateStateField } from "@/lib/state-action";
import type { SetStateAction } from "react";
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
  const setCategories = (action: SetStateAction<AdminReviewSnapshot["categories"]>) =>
    updateStateField(setSnapshot, "categories", action);
  const setWords = (action: SetStateAction<AdminReviewSnapshot["words"]>) =>
    updateStateField(setSnapshot, "words", action);
  const setPublishedCategories = (action: SetStateAction<AdminReviewSnapshot["publishedCategories"]>) =>
    updateStateField(setSnapshot, "publishedCategories", action);
  const setPublishedWords = (action: SetStateAction<AdminReviewSnapshot["publishedWords"]>) =>
    updateStateField(setSnapshot, "publishedWords", action);

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
