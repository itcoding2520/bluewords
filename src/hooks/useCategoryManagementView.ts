import { useMemo } from "react";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { getPageItems, getPageMetadata } from "@/lib/pagination";
import { isDefaultVocabularyCategory } from "@/lib/vocabulary/default-categories";
import { isCommunityCategoryId } from "@/lib/vocabulary/community-category-id";
import type { CategoryManagementFilter, CategoryManagementSort } from "@/lib/category-management-filters";

function isDefaultCategory(category: VocabularyCategoryRow) {
  return category.is_default || isDefaultVocabularyCategory(category.name);
}

function isPublishedSharedCategory(category: VocabularyCategoryRow) {
  return isCommunityCategoryId(category.id) || category.user_id === "community";
}

export function useCategoryManagementView({
  categories,
  filterBy,
  sortBy,
  page,
  pageSize,
}: {
  categories: VocabularyCategoryRow[];
  filterBy: CategoryManagementFilter;
  sortBy: CategoryManagementSort;
  page: number;
  pageSize: number;
}) {
  const managedCategories = useMemo(() => {
    const filteredCategories = categories.filter((category) => {
      if (filterBy === "mine") return !isDefaultCategory(category) && !isPublishedSharedCategory(category);
      if (filterBy === "default") return isDefaultCategory(category);
      if (filterBy === "community") return isPublishedSharedCategory(category) && !isDefaultCategory(category);
      return true;
    });

    return [...filteredCategories].sort((left, right) => {
      if (sortBy === "name") return left.name.localeCompare(right.name);
      if (!left.created_at || !right.created_at) {
        if (!left.created_at && !right.created_at) return left.name.localeCompare(right.name);
        return left.created_at ? -1 : 1;
      }
      const byDate = new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
      return (sortBy === "newest" ? -byDate : byDate) || left.name.localeCompare(right.name);
    });
  }, [categories, filterBy, sortBy]);

  const pageMetadata = useMemo(
    () => getPageMetadata(managedCategories.length, page, pageSize),
    [managedCategories.length, page, pageSize],
  );
  const pageCategories = useMemo(
    () => getPageItems(managedCategories, pageMetadata.currentPage, pageSize),
    [managedCategories, pageMetadata.currentPage, pageSize],
  );

  return {
    isDefaultCategory,
    managedCategories,
    pageCount: pageMetadata.pageCount,
    currentPage: pageMetadata.currentPage,
    pageCategories,
    firstVisibleCategory: pageMetadata.first,
    lastVisibleCategory: pageMetadata.last,
  };
}
