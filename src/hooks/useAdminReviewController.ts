import { useCallback, useEffect, useState } from "react";
import { useConfirmDialog } from "@/components/ui/ConfirmDialogProvider";
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

export function useAdminReviewController() {
  const confirmDialog = useConfirmDialog();
  const supabase = useSupabaseClient();
  const [categories, setCategories] = useState<AdminReviewSubmission[]>([]);
  const [words, setWords] = useState<AdminReviewSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [blockedWordId, setBlockedWordId] = useState<string | null>(null);
  const [publishedCategories, setPublishedCategories] = useState<PublishedCategory[]>([]);
  const [publishedWords, setPublishedWords] = useState<PublishedWord[]>([]);
  const [ownerEmails, setOwnerEmails] = useState<Record<string, string>>({});
  const [newCategory, setNewCategory] = useState("");
  const [newWord, setNewWord] = useState("");
  const [newMeaning, setNewMeaning] = useState("");
  const [newWordCategory, setNewWordCategory] = useState("");

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
      const { error: updateError } = await supabase.from(table).update({ status }).eq("id", id);
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

  async function addPublishedCategory() {
    const name = newCategory.trim();
    if (!name) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error: insertError } = await supabase.from("community_categories").insert({
      owner_id: user.id,
      name,
      color: "blue",
      status: "published",
    });
    if (insertError) setError(insertError.code === "23505" ? "That category already exists." : insertError.message);
    else {
      setNewCategory("");
      await refresh();
    }
  }

  async function addPublishedWord() {
    const word = newWord.trim();
    if (!word || !newWordCategory) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error: insertError } = await supabase.from("community_words").insert({
      owner_id: user.id,
      category_id: newWordCategory,
      word,
      meaning: newMeaning.trim(),
      status: "published",
    });
    if (insertError) setError(insertError.code === "23505" ? "That word already exists in this category." : insertError.message);
    else {
      setNewWord("");
      setNewMeaning("");
      await refresh();
    }
  }

  async function removePublished(
    table: "community_categories" | "community_words",
    item: PublishedCategory | PublishedWord
  ) {
    const label = "name" in item ? item.name : item.word;
    const confirmed = await confirmDialog({
      title: "Remove published item?",
      description: `Remove “${label}” from the published vocabulary?`,
      confirmLabel: "Remove",
    });
    if (!confirmed) return;
    const { error: updateError } = await supabase.from(table).update({ status: "removed" }).eq("id", item.id);
    if (updateError) setError(updateError.message);
    else await refresh();
  }

  async function editPublishedWord(item: PublishedWord) {
    const word = window.prompt("Edit English word", item.word);
    if (word === null || !word.trim()) return;
    const meaning = window.prompt("Edit meaning", item.meaning);
    if (meaning === null) return;
    const { error: updateError } = await supabase.from("community_words").update({
      word: word.trim(),
      meaning: meaning.trim(),
    }).eq("id", item.id);
    if (updateError) setError(updateError.code === "23505"
      ? "A word with that spelling already exists in this category."
      : updateError.message);
    else await refresh();
  }

  async function editPublishedCategory(item: PublishedCategory) {
    const name = window.prompt("Edit category name", item.name);
    if (name === null || !name.trim()) return;
    const { error: updateError } = await supabase.from("community_categories").update({
      name: name.trim(),
    }).eq("id", item.id);
    if (updateError) setError(updateError.code === "23505"
      ? "A category with that name already exists."
      : updateError.message);
    else await refresh();
  }

  return {
    categories, words, loading, error, busy, blockedWordId,
    publishedCategories, publishedWords, ownerEmails,
    newCategory, setNewCategory, newWord, setNewWord,
    newMeaning, setNewMeaning, newWordCategory, setNewWordCategory,
    refresh, moderate, addPublishedCategory, addPublishedWord,
    removePublished, editPublishedWord, editPublishedCategory,
  };
}
