import { useCallback, useEffect, useMemo, useState } from "react";
import { useConfirmDialog } from "@/components/ui/ConfirmDialogProvider";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { defaultVocabularyCategories, defaultVocabularyWords } from "@/data/default-vocabulary";
import { getAdminCachedData, invalidateAdminDataCache } from "@/lib/admin-data-cache.mjs";
import { loadAdminUserEmails } from "@/lib/admin-users";

export type CategoryTab = "default" | "published" | "pending";

export interface CommunityCategory {
  id: string;
  owner_id: string;
  name: string;
  color: string;
  status: "pending" | "published";
  created_at: string;
  image_path: string | null;
}

interface CommunityWord {
  id: string;
  owner_id: string;
  category_id: string;
  word: string;
  meaning: string;
  status: string;
  created_at: string;
  image_path: string | null;
}

export function useAdminCategoryManagementController() {
  const confirmDialog = useConfirmDialog();
  const supabase = useSupabaseClient();
  const [activeTab, setActiveTab] = useState<CategoryTab>("default");
  const [selectedId, setSelectedId] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [communityCategories, setCommunityCategories] = useState<CommunityCategory[]>([]);
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [words, setWords] = useState<CommunityWord[]>([]);
  const [wordEmails, setWordEmails] = useState<Record<string, string>>({});
  const [wordsLoading, setWordsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const customCategories = useMemo(
    () => communityCategories.filter((category) =>
      category.status === (activeTab === "pending" ? "pending" : "published")
      && !defaultVocabularyCategories.some((item) =>
        item.name.trim().toLocaleLowerCase() === category.name.trim().toLocaleLowerCase()
      )
    ),
    [activeTab, communityCategories]
  );
  const currentCategories = activeTab === "default" ? defaultVocabularyCategories : customCategories;
  const visibleCategories = currentCategories.filter((category) =>
    category.name.toLocaleLowerCase().includes(categorySearch.trim().toLocaleLowerCase())
  );
  const selectedCategory = currentCategories.find((category) => category.id === selectedId)
    ?? currentCategories[0]
    ?? null;

  const refresh = useCallback(async (force = true) => {
    setLoading(true);
    setError("");
    if (force) invalidateAdminDataCache();
    try {
      const result = await getAdminCachedData("admin:categories:list", async () => {
        const { data, error: loadError } = await supabase.from("community_categories")
          .select("id, owner_id, name, color, status, created_at, image_path")
          .in("status", ["published", "pending"]).order("name");
        if (loadError) throw loadError;
        const loadedCategories = (data ?? []) as CommunityCategory[];
        const ownerIds = loadedCategories.map((category) => category.owner_id);
        const usersById = await loadAdminUserEmails(ownerIds, "Could not load category owners.");
        return { categories: loadedCategories, emails: usersById };
      }, { force });
      setCommunityCategories(result.categories);
      setEmails(result.emails);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load categories.");
      setCommunityCategories([]);
      setEmails({});
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(false); }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    if (!selectedCategory) return;
    const sharedCategory = activeTab === "default"
      ? communityCategories.find((category) => category.status === "published"
        && category.name.trim().toLocaleLowerCase() === selectedCategory.name.trim().toLocaleLowerCase())
      : selectedCategory;
    if (!sharedCategory) {
      const timer = window.setTimeout(() => {
        setWords([]);
        setWordEmails({});
        setWordsLoading(false);
      }, 0);
      return () => window.clearTimeout(timer);
    }

    let cancelled = false;
    const loadWords = async () => {
      setWordsLoading(true);
      setError("");
      try {
        const result = await getAdminCachedData(
          `admin:categories:words:${sharedCategory.id}:${activeTab}`,
          async () => {
            const { data, error: loadError } = await supabase.from("community_words")
              .select("id, owner_id, category_id, word, meaning, status, created_at, image_path")
              .eq("category_id", sharedCategory.id)
              .eq("status", activeTab === "pending" ? "pending" : "published")
              .order("word");
            if (loadError) throw loadError;
            const loadedWords = (data ?? []) as CommunityWord[];
            const ownerIds = loadedWords.map((word) => word.owner_id);
            const ownerEmails = await loadAdminUserEmails(ownerIds, "Could not load word authors.");
            return { words: loadedWords, emails: ownerEmails };
          }
        );
        if (cancelled) return;
        setWords(result.words);
        setWordEmails(result.emails);
      } catch (cause) {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "Could not load words.");
        setWords([]);
        setWordEmails({});
      }
      setWordsLoading(false);
    };
    const timer = window.setTimeout(() => { void loadWords(); }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [activeTab, communityCategories, selectedCategory, supabase]);

  const defaultWords = activeTab === "default" && selectedCategory
    ? defaultVocabularyWords.filter((word) => word.category === selectedCategory.name)
    : [];
  const selectedSharedCategory = selectedCategory
    ? activeTab === "default"
      ? communityCategories.find((item) => item.status === "published"
        && item.name.trim().toLocaleLowerCase() === selectedCategory.name.trim().toLocaleLowerCase()) ?? null
      : "owner_id" in selectedCategory ? selectedCategory : null
    : null;
  const selectedFallbackImage = defaultWords.find((word) => word.imagePath)?.imagePath
    ?? words.find((word) => word.image_path)?.image_path
    ?? null;

  async function editSharedCategory(category: CommunityCategory) {
    const name = window.prompt("Category name", category.name)?.trim();
    if (!name || name === category.name) return;
    const { error: updateError } = await supabase.from("community_categories")
      .update({ name }).eq("id", category.id);
    if (updateError) setError(updateError.message);
    else await refresh();
  }

  async function removeSharedCategory(category: CommunityCategory) {
    const confirmed = await confirmDialog({
      title: "Remove category?",
      description: `Remove “${category.name}” and its published words?`,
      confirmLabel: "Remove",
    });
    if (!confirmed) return;
    const { error: deleteError } = await supabase.from("community_categories")
      .delete().eq("id", category.id);
    if (deleteError) setError(deleteError.message);
    else {
      setSelectedId("");
      await refresh();
    }
  }

  async function editSharedWord(word: CommunityWord) {
    const nextWord = window.prompt("Word", word.word)?.trim();
    if (!nextWord) return;
    const meaning = window.prompt("Meaning", word.meaning)?.trim();
    if (meaning == null || (nextWord === word.word && meaning === word.meaning)) return;
    const { error: updateError } = await supabase.from("community_words")
      .update({ word: nextWord, meaning }).eq("id", word.id);
    if (updateError) setError(updateError.message);
    else {
      invalidateAdminDataCache();
      setWords((current) => current.map((item) => item.id === word.id
        ? { ...item, word: nextWord, meaning }
        : item));
    }
  }

  async function removeSharedWord(word: CommunityWord) {
    const confirmed = await confirmDialog({
      title: "Remove word?",
      description: `Remove “${word.word}” from this category?`,
      confirmLabel: "Remove",
    });
    if (!confirmed) return;
    const { error: deleteError } = await supabase.from("community_words")
      .delete().eq("id", word.id);
    if (deleteError) setError(deleteError.message);
    else {
      invalidateAdminDataCache();
      setWords((current) => current.filter((item) => item.id !== word.id));
    }
  }

  return {
    activeTab,
    setActiveTab,
    setSelectedId,
    categorySearch,
    setCategorySearch,
    communityCategories,
    emails,
    words,
    wordEmails,
    wordsLoading,
    loading,
    error,
    customCategories,
    currentCategories,
    visibleCategories,
    selectedCategory,
    defaultWords,
    selectedSharedCategory,
    selectedFallbackImage,
    refresh,
    editSharedCategory,
    removeSharedCategory,
    editSharedWord,
    removeSharedWord,
  };
}
