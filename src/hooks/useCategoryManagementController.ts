import { useState } from "react";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { useVocabulary } from "@/contexts/VocabularyContext";
import { useCategoryManagementView } from "@/hooks/useCategoryManagementView";
import { useCategoryManagementAccess } from "@/hooks/useCategoryManagementAccess";
import { useCategoryImageActions } from "@/hooks/useCategoryImageActions";
import { useCategoryManagementActions } from "@/hooks/useCategoryManagementActions";
export type { CategoryManagementSort, CategoryManagementFilter } from "@/hooks/useCategoryManagementView";
import type { CategoryManagementSort, CategoryManagementFilter } from "@/hooks/useCategoryManagementView";

export function useCategoryManagementController() {
  const { categories, words, addCategory, updateCategory, deleteCategory, refreshCategories } = useVocabulary({
    loadWords: false,
    loadCategories: false,
  });
  const supabase = useSupabaseClient();
  const { isAdmin, categoryAuthors } = useCategoryManagementAccess(supabase);
  const { saveImage } = useCategoryImageActions({
    supabase,
    isAdmin,
    updateCategory,
    refreshCategories,
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<CategoryManagementSort>("name");
  const [filterBy, setFilterBy] = useState<CategoryManagementFilter>("all");

  const {
    isDefaultCategory,
    managedCategories,
    pageCount,
    currentPage,
    pageCategories,
    firstVisibleCategory,
    lastVisibleCategory,
  } = useCategoryManagementView({ categories, filterBy, sortBy, page, pageSize });

  const actions = useCategoryManagementActions({
    supabase,
    isAdmin,
    setPage,
    saveImage,
    addCategory,
    updateCategory,
    deleteCategory,
  });

  return {
    categories, words, isAdmin, categoryAuthors, page, setPage,
    pageSize, setPageSize, sortBy, setSortBy, filterBy, setFilterBy,
    isDefaultCategory, managedCategories, pageCount, currentPage, pageCategories,
    firstVisibleCategory, lastVisibleCategory, ...actions,
  };
}
