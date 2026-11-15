import { useMemo, useState } from "react";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { defaultVocabularyCategories, defaultVocabularyWords } from "@/data/default-vocabulary";
import { useAdminCategoryListData } from "@/hooks/useAdminCategoryListData";
import { useAdminCategoryWordsData } from "@/hooks/useAdminCategoryWordsData";
import { useAdminCategoryManagementActions } from "@/hooks/useAdminCategoryManagementActions";
import type { CategoryTab } from "@/lib/admin-category-data";
import { normalizeVocabularyLabel } from "@/lib/vocabulary/normalize-text";
import {
  deriveAdminCategoryDetails,
  deriveAdminCategorySelection,
  indexPublishedCategories,
} from "@/lib/admin-category-management-view";

export type { CategoryTab, CommunityCategory } from "@/lib/admin-category-data";

export function useAdminCategoryManagementController() {
  const supabase = useSupabaseClient();
  const defaultCategoryNames = useMemo(
    () => new Set(defaultVocabularyCategories.map((category) => normalizeVocabularyLabel(category.name))),
    []
  );
  const defaultWordsByCategory = useMemo(() => {
    const wordsByCategory = new Map<string, typeof defaultVocabularyWords>();
    for (const word of defaultVocabularyWords) {
      const categoryWords = wordsByCategory.get(word.category) ?? [];
      categoryWords.push(word);
      wordsByCategory.set(word.category, categoryWords);
    }
    return wordsByCategory;
  }, []);
  const [activeTab, setActiveTab] = useState<CategoryTab>("default");
  const [selectedId, setSelectedId] = useState("");
  const [categorySearch, setCategorySearch] = useState("");

  function changeTab(tab: CategoryTab) {
    setActiveTab(tab);
    setSelectedId("");
    setCategorySearch("");
  }
  const {
    communityCategories,
    emails,
    loading,
    error,
    setError,
    refresh,
  } = useAdminCategoryListData(supabase);
  const publishedCategoriesByName = useMemo(
    () => indexPublishedCategories(communityCategories),
    [communityCategories]
  );
  const {
    customCategories,
    currentCategories,
    visibleCategories,
    selectedCategory,
  } = deriveAdminCategorySelection({
    activeTab,
    selectedId,
    categorySearch,
    communityCategories,
    defaultCategories: defaultVocabularyCategories,
    defaultCategoryNames,
  });
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

  const {
    visibleCategoryRows,
    defaultWords,
    selectedSharedCategory,
    selectedFallbackImage,
  } = deriveAdminCategoryDetails({
    activeTab,
    visibleCategories,
    selectedCategory,
    publishedCategoriesByName,
    defaultWordsByCategory,
    emails,
    words,
  });

  return {
    activeTab,
    changeTab,
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
