import { useMemo, useState } from "react";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { defaultVocabularyCategories, defaultVocabularyWords } from "@/data/default-vocabulary";
import { useAdminCategoryListData } from "@/hooks/useAdminCategoryListData";
import { useAdminCategoryWordsData } from "@/hooks/useAdminCategoryWordsData";
import { useAdminCategoryManagementActions } from "@/hooks/useAdminCategoryManagementActions";
import { groupBy } from "@/lib/group-by";
import type { CategoryTab } from "@/lib/admin-category-data";
import {
  deriveAdminCategoryDetails,
  deriveAdminCategorySelection,
  indexPublishedCategories,
} from "@/lib/admin-category-management-view";

export type { CategoryTab, CommunityCategory } from "@/lib/admin-category-data";

export function useAdminCategoryManagementController() {
  const supabase = useSupabaseClient();
  const defaultWordsByCategory = useMemo(
    () => groupBy(defaultVocabularyWords, (word) => word.category),
    [],
  );
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
  } = useMemo(() => deriveAdminCategorySelection({
    activeTab,
    selectedId,
    categorySearch,
    communityCategories,
    defaultCategories: defaultVocabularyCategories,
  }), [activeTab, categorySearch, communityCategories, selectedId]);
  const {
    words,
    setWords,
    wordEmails,
    wordsLoading,
  } = useAdminCategoryWordsData(supabase, activeTab, selectedCategory, publishedCategoriesByName, setError);
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
  } = useMemo(() => deriveAdminCategoryDetails({
    activeTab,
    visibleCategories,
    selectedCategory,
    publishedCategoriesByName,
    defaultWordsByCategory,
    emails,
    words,
  }), [activeTab, defaultWordsByCategory, emails, publishedCategoriesByName, selectedCategory, visibleCategories, words]);

  return {
    selection: {
      activeTab,
      changeTab,
      setSelectedId,
      categorySearch,
      setCategorySearch,
    },
    data: {
      communityCategories,
      emails,
      words,
      wordEmails,
      wordsLoading,
      loading,
      error,
    },
    view: {
      customCategories,
      currentCategories,
      visibleCategories,
      visibleCategoryRows,
      selectedCategory,
      defaultWords,
      selectedSharedCategory,
      selectedFallbackImage,
    },
    actions: {
      refresh,
      editSharedCategory,
      removeSharedCategory,
      editSharedWord,
      removeSharedWord,
    },
  };
}
