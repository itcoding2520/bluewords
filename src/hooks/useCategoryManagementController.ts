import { useState } from "react";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { useVocabulary } from "@/contexts/VocabularyContext";
import { useCategoryManagementView } from "@/hooks/useCategoryManagementView";
import { useCategoryManagementAccess } from "@/hooks/useCategoryManagementAccess";
import { useCategoryImageActions } from "@/hooks/useCategoryImageActions";
import { useCategoryManagementActions } from "@/hooks/useCategoryManagementActions";
import { useCategoryManagementFormState } from "@/hooks/useCategoryManagementFormState";
export type { CategoryManagementSort, CategoryManagementFilter } from "@/lib/category-management-filters";
import type { CategoryManagementSort, CategoryManagementFilter } from "@/lib/category-management-filters";

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
    managedCategories,
    pageCount,
    currentPage,
    pageCategories,
    firstVisibleCategory,
    lastVisibleCategory,
  } = useCategoryManagementView({ categories, filterBy, sortBy, page, pageSize });

  const form = useCategoryManagementFormState();
  const formState = {
    name: form.name,
    setName: form.setName,
    color: form.color,
    setColor: form.setColor,
    newImage: form.newImage,
    setNewImage: form.setNewImage,
    editing: form.editing,
    setEditing: form.setEditing,
    editName: form.editName,
    setEditName: form.setEditName,
    editColor: form.editColor,
    setEditColor: form.setEditColor,
    editImage: form.editImage,
    setEditImage: form.setEditImage,
    startEdit: form.startEdit,
  };
  const actions = useCategoryManagementActions({
    form,
    supabase,
    isAdmin,
    setPage,
    saveImage,
    addCategory,
    updateCategory,
    deleteCategory,
  });

  return {
    access: { isAdmin },
    data: {
      categories,
      words,
      categoryAuthors,
      managedCategories,
      pageCategories,
    },
    pagination: {
      page,
      setPage,
      pageSize,
      setPageSize,
      pageCount,
      currentPage,
      firstVisibleCategory,
      lastVisibleCategory,
    },
    filters: {
      sortBy,
      setSortBy,
      filterBy,
      setFilterBy,
    },
    form: formState,
    actions: { ...actions, startEdit: form.startEdit },
  };
}
