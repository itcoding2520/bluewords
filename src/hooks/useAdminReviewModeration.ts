import { getErrorMessage } from "@/lib/errors";
import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { SupabaseClient } from "@/lib/supabase/client";
import { invalidateAdminDataCache } from "@/lib/admin-data-cache.mjs";
import { updateAdminReviewStatus } from "@/lib/admin-review-api";
import type {
  AdminReviewSubmission,
  PublishedCategory,
  PublishedWord,
} from "@/lib/admin-review-types";
import {
  mapPublishedCategorySubmission,
  mapPublishedWordSubmission,
} from "@/lib/admin-review-mapping";

interface AdminReviewModerationData {
  categories: AdminReviewSubmission[];
  setCategories: Dispatch<SetStateAction<AdminReviewSubmission[]>>;
  words: AdminReviewWordSubmission[];
  setWords: Dispatch<SetStateAction<AdminReviewWordSubmission[]>>;
  setError: (error: string) => void;
  setPublishedCategories: Dispatch<SetStateAction<PublishedCategory[]>>;
  setPublishedWords: Dispatch<SetStateAction<PublishedWord[]>>;
}

interface AdminReviewWordSubmission extends AdminReviewSubmission {
  word: string;
  meaning: string;
  category_id: string;
  category_name: string;
  category_status: string;
  category_image_path: string | null;
  category_color: string;
}

export function useAdminReviewModeration(supabase: SupabaseClient, {
  categories,
  setCategories,
  words,
  setWords,
  setError,
  setPublishedCategories,
  setPublishedWords,
}: AdminReviewModerationData) {
  const [busy, setBusy] = useState<string | null>(null);
  const [blockedWordId, setBlockedWordId] = useState<string | null>(null);

  useEffect(() => {
    if (!blockedWordId) return;
    const timer = window.setTimeout(() => setBlockedWordId(null), 3000);
    return () => window.clearTimeout(timer);
  }, [blockedWordId]);

  async function moderate(
    table: "community_categories" | "community_words",
    id: string,
    status: "published" | "rejected"
  ) {
    const word = table === "community_words"
      ? words.find((item) => item.id === id)
      : undefined;
    if (table === "community_words" && status === "published") {
      if (word && word.category_status !== "published") {
        setBlockedWordId(id);
        return;
      }
    }
    setBlockedWordId(null);
    setBusy(id);
    setError("");
    try {
      const updateError = await updateAdminReviewStatus(supabase, table, id, status);
      if (updateError) {
        setError(updateError.code === "23505"
          ? "A published category or word with that name already exists."
          : updateError.message);
        return;
      }

      invalidateAdminDataCache();
      if (table === "community_categories") {
        const category = categories.find((item) => item.id === id);
        setCategories((current) => current.filter((item) => item.id !== id));
        if (category && status === "published") {
          const publishedCategory = mapPublishedCategorySubmission(category);
          setPublishedCategories((current) => [
            ...current.filter((item) => item.id !== id),
            publishedCategory,
          ]);
        }
        setWords((current) => current.map((item) => item.category_id === id
          ? { ...item, category_status: status }
          : item));
      } else {
        setWords((current) => current.filter((item) => item.id !== id));
        if (word && status === "published") {
          const publishedWord = mapPublishedWordSubmission(word);
          if (publishedWord) {
            setPublishedWords((current) => [...current.filter((item) => item.id !== id), publishedWord]);
          }
        }
      }
    } catch (cause) {
      setError(getErrorMessage(cause, "Could not update this request."));
    } finally {
      setBusy(null);
    }
  }

  return { busy, blockedWordId, moderate };
}
