import { useCallback, useEffect, useState } from "react";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { getAdminCachedData, invalidateAdminDataCache } from "@/lib/admin-data-cache.mjs";
import { loadAdminUserEmails } from "@/lib/admin-users";

export interface AdminReviewSubmission {
  id: string;
  owner_id: string;
  status: string;
  created_at: string;
  color?: string;
  name?: string;
  word?: string;
  meaning?: string;
  category_id?: string;
  category_name?: string;
  category_status?: string;
  image_path?: string | null;
  category_image_path?: string | null;
  category_color?: string;
}

export interface PublishedCategory {
  id: string;
  owner_id: string;
  name: string;
  color: string;
  status: string;
  image_path: string | null;
}

export interface PublishedWord {
  id: string;
  owner_id: string;
  category_id: string;
  word: string;
  meaning: string;
  status: string;
  image_path: string | null;
}

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
      const result = await getAdminCachedData("admin:review:all", async () => {
        const [categoryResult, wordResult] = await Promise.all([
          supabase.from("community_categories").select("id, owner_id, name, color, image_path, status, created_at").eq("status", "pending").order("created_at"),
          supabase.from("community_words").select("id, owner_id, word, meaning, category_id, status, created_at, community_categories!inner(name, status, image_path, color)").eq("status", "pending").order("created_at"),
        ]);
        if (categoryResult.error || wordResult.error) throw categoryResult.error ?? wordResult.error;
        const pendingCategories = (categoryResult.data ?? []) as AdminReviewSubmission[];
        const pendingWords = ((wordResult.data ?? []) as unknown as Array<AdminReviewSubmission & {
          community_categories: { name: string; status: string; image_path: string | null; color: string };
        }>).map(({ community_categories, ...item }) => ({
          ...item,
          category_name: community_categories.name,
          category_status: community_categories.status,
          category_image_path: community_categories.image_path,
          category_color: community_categories.color,
        }));

        const [publishedCategoryResult, publishedWordResult] = await Promise.all([
          supabase.from("community_categories").select("id, owner_id, name, color, image_path, status").eq("status", "published").order("name"),
          supabase.from("community_words").select("id, owner_id, category_id, word, meaning, status, image_path").eq("status", "published").order("word"),
        ]);
        if (publishedCategoryResult.error || publishedWordResult.error) {
          throw publishedCategoryResult.error ?? publishedWordResult.error;
        }
        const liveCategories = (publishedCategoryResult.data ?? []) as PublishedCategory[];
        const liveWords = (publishedWordResult.data ?? []) as PublishedWord[];
        const ownerIds = [...pendingCategories, ...pendingWords, ...liveCategories, ...liveWords]
          .map((item) => item.owner_id);
        const nextEmails = await loadAdminUserEmails(ownerIds, "Could not load submission authors.");
        return {
          categories: pendingCategories,
          words: pendingWords,
          publishedCategories: liveCategories,
          publishedWords: liveWords,
          ownerEmails: nextEmails,
        };
      }, { force });
      setCategories(result.categories);
      setWords(result.words);
      setPublishedCategories(result.publishedCategories);
      setPublishedWords(result.publishedWords);
      setOwnerEmails(result.ownerEmails);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load requests.");
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
