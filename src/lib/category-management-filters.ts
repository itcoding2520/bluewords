export const CATEGORY_MANAGEMENT_SORTS = ["name", "newest", "oldest"] as const;
export const CATEGORY_MANAGEMENT_FILTERS = ["all", "mine", "default", "community"] as const;

export type CategoryManagementSort = (typeof CATEGORY_MANAGEMENT_SORTS)[number];
export type CategoryManagementFilter = (typeof CATEGORY_MANAGEMENT_FILTERS)[number];

export function isCategoryManagementSort(value: unknown): value is CategoryManagementSort {
  return typeof value === "string" && CATEGORY_MANAGEMENT_SORTS.some((sort) => sort === value);
}

export function isCategoryManagementFilter(value: unknown): value is CategoryManagementFilter {
  return typeof value === "string" && CATEGORY_MANAGEMENT_FILTERS.some((filter) => filter === value);
}
