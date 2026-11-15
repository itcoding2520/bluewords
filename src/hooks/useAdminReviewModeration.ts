import { useEffect, useState } from "react";
import type { SupabaseClient } from "@/lib/supabase/client";
import { invalidateAdminDataCache } from "@/lib/admin-data-cache.mjs";
import { updateAdminReviewStatus } from "@/lib/admin-review-api";
import type { useAdminReviewData } from "@/hooks/useAdminReviewData";
import type { PublishedWord } from "@/lib/admin-review-types";

type AdminReviewData = ReturnType<typeof useAdminReviewData>;

export function useAdminReviewModeration(supabase: SupabaseClient, {
  categories,
  setCategories,
  words,
  setWords,
  setError,
  setPublishedCategories,
  setPublishedWords,
}: AdminReviewData) {
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
    if (table === "community_words" && status === "published") {
      const word = words.find((item) => item.id === id);
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
          setPublishedCategories((current) => [...current.filter((item) => item.id !== id), {
            id: category.id,
            owner_id: category.owner_id,
            name: category.name ?? "",
            color: category.color ?? "blue",
            status: "published",
            image_path: category.image_path ?? null,
          }]);
        }
        setWords((current) => current.map((item) => item.category_id === id
          ? { ...item, category_status: status }
          : item));
      } else {
        const word = words.find((item) => item.id === id);
        setWords((current) => current.filter((item) => item.id !== id));
        if (word && status === "published" && word.category_id && word.word) {
          const publishedWord: PublishedWord = {
            id: word.id,
            owner_id: word.owner_id,
            category_id: word.category_id,
            word: word.word,
            meaning: word.meaning ?? "",
            status: "published",
            image_path: word.image_path ?? null,
          };
          setPublishedWords((current) => [...current.filter((item) => item.id !== id), publishedWord]);
        }
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update this request.");
    } finally {
      setBusy(null);
    }
  }

  return { busy, blockedWordId, moderate };
}
