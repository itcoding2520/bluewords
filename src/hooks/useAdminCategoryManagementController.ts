import { useMemo, useState } from "react";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { defaultVocabularyCategories, defaultVocabularyWords } from "@/data/default-vocabulary";
import { useAdminCategoryListData } from "@/hooks/useAdminCategoryListData";
import { useAdminCategoryWordsData } from "@/hooks/useAdminCategoryWordsData";
import { useAdminCategoryManagementActions } from "@/hooks/useAdminCategoryManagementActions";
import type { CategoryTab } from "@/lib/admin-category-data";

export type { CategoryTab, CommunityCategory } from "@/lib/admin-category-data";

export function useAdminCategoryManagementController() {
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
  const {
    editSharedCategory,
    removeSharedCategory,
    editSharedWord,
    removeSharedWord,
  } = useAdminCategoryManagementActions({
    supabase,
    setError,
    refresh,
    setSelectedId,
    setWords,
  });

  const visibleCategoryRows = visibleCategories.map((category) => {
    const shared = activeTab === "default"
      ? communityCategories.find((item) => item.status === "published"
        && item.name.trim().toLocaleLowerCase() === category.name.trim().toLocaleLowerCase())
      : "owner_id" in category ? category : null;
    const fallbackImage = activeTab === "default"
      ? defaultVocabularyWords.find((word) => word.category === category.name && word.imagePath)?.imagePath
      : category.id === selectedCategory?.id
        ? words.find((word) => word.image_path)?.image_path
        : undefined;

    return {
      category,
      shared,
      owner: shared ? emails[shared.owner_id] ?? "Loading owner…" : null,
      fallbackImage,
      defaultWordCount: activeTab === "default"
        ? defaultVocabularyWords.filter((word) => word.category === category.name).length
        : null,
      createdAt: "owner_id" in category ? category.created_at : null,
    };
  });

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
    visibleCategoryRows,
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
