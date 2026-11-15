import { useMemo, useState } from "react";
import { useConfirmDialog } from "@/contexts/confirm-dialog";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { defaultVocabularyCategories, defaultVocabularyWords } from "@/data/default-vocabulary";
import { invalidateAdminDataCache } from "@/lib/admin-data-cache.mjs";
import { useAdminCategoryListData } from "@/hooks/useAdminCategoryListData";
import { useAdminCategoryWordsData } from "@/hooks/useAdminCategoryWordsData";
import {
  removeAdminSharedCategory,
  removeAdminSharedWord,
  updateAdminSharedCategory,
  updateAdminSharedWord,
} from "@/lib/admin-category-api";
import type { CategoryTab, CommunityCategory, CommunityWord } from "@/lib/admin-category-data";

export type { CategoryTab, CommunityCategory } from "@/lib/admin-category-data";

export function useAdminCategoryManagementController() {
  const confirmDialog = useConfirmDialog();
  const supabase = useSupabaseClient();
  const [activeTab, setActiveTab] = useState<CategoryTab>("default");
  const [selectedId, setSelectedId] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const {
    communityCategories,
    emails,
    loading,
    error,
    setError,
    refresh,
  } = useAdminCategoryListData(supabase);

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
  const {
    words,
    setWords,
    wordEmails,
    wordsLoading,
  } = useAdminCategoryWordsData(supabase, activeTab, selectedCategory, communityCategories, setError);

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
    const updateError = await updateAdminSharedCategory(supabase, category.id, name);
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
    const deleteError = await removeAdminSharedCategory(supabase, category.id);
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
    const updateError = await updateAdminSharedWord(supabase, word.id, nextWord, meaning);
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
    const deleteError = await removeAdminSharedWord(supabase, word.id);
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
