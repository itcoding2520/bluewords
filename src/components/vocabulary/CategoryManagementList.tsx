import { type FormEvent } from "react";
import { ChevronLeft, ChevronRight, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryColor } from "@/config/vocabulary";
import { CategoryManagementCard } from "@/components/vocabulary/CategoryManagementCard";
import {
  isCategoryManagementFilter,
  isCategoryManagementSort,
  type CategoryManagementFilter,
  type CategoryManagementSort,
} from "@/lib/category-management-filters";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { normalizeVocabularyLabel } from "@/lib/vocabulary/normalize-text";
import { createPageNavigationActions } from "@/lib/pagination";
import { useCategoryFallbackWordImages } from "@/hooks/useCategoryFallbackWordImages";

const categoryFilters: Array<{ value: CategoryManagementFilter; label: string }> = [
  { value: "all", label: "All categories" },
  { value: "mine", label: "By me" },
  { value: "default", label: "Default" },
  { value: "community", label: "Community" },
];
const categorySorts: Array<{ value: CategoryManagementSort; label: string }> = [
  { value: "name", label: "A → Z" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
];
const categoryPageSizes = [10, 20, 50];

export function CategoryManagementList({
  words,
  isAdmin,
  categoryAuthors,
  editing,
  onEditingChange,
  editName,
  onEditNameChange,
  editColor,
  onEditColorChange,
  onEditImageChange,
  isSaving,
  filterBy,
  onFilterChange,
  sortBy,
  onSortChange,
  managedCategories,
  pageCategories,
  pageCount,
  currentPage,
  firstVisibleCategory,
  lastVisibleCategory,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onStartEdit,
  onUpdate,
  onDelete,
}: {
  words: VocabularyWord[];
  isAdmin: boolean;
  categoryAuthors: Record<string, string>;
  editing: VocabularyCategoryRow | null;
  onEditingChange: (category: VocabularyCategoryRow | null) => void;
  editName: string;
  onEditNameChange: (value: string) => void;
  editColor: VocabularyCategoryColor;
  onEditColorChange: (color: VocabularyCategoryColor) => void;
  onEditImageChange: (file: File | null) => void;
  isSaving: boolean;
  filterBy: CategoryManagementFilter;
  onFilterChange: (filter: CategoryManagementFilter) => void;
  sortBy: CategoryManagementSort;
  onSortChange: (sort: CategoryManagementSort) => void;
  managedCategories: VocabularyCategoryRow[];
  pageCategories: VocabularyCategoryRow[];
  pageCount: number;
  currentPage: number;
  firstVisibleCategory: number;
  lastVisibleCategory: number;
  pageSize: number;
  onPageChange: (update: (page: number) => number) => void;
  onPageSizeChange: (size: number) => void;
  onStartEdit: (category: VocabularyCategoryRow) => void;
  onUpdate: (event: FormEvent<HTMLFormElement>) => void;
  onDelete: (category: VocabularyCategoryRow) => void;
}) {
  const fallbackImagesByCategory = useCategoryFallbackWordImages(words);
  const pageNavigation = createPageNavigationActions(pageCount, onPageChange);

  return (
    <div className="category-list-panel">
      <div className="category-list-toolbar">
        <h2>{managedCategories.length} categories</h2>
        <label className="category-inline-filter">Filter by
          <Select aria-label="Filter categories" value={filterBy} onChange={(event) => { if (isCategoryManagementFilter(event.target.value)) onFilterChange(event.target.value); }}>
            {categoryFilters.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </Select>
        </label>
        <label className="category-inline-filter">Sort by
          <Select aria-label="Sort categories" value={sortBy} onChange={(event) => { if (isCategoryManagementSort(event.target.value)) onSortChange(event.target.value); }}>
            {categorySorts.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </Select>
        </label>
      </div>
      <div className="category-card-grid">
        {pageCategories.map((category) => {
          const normalizedCategoryName = normalizeVocabularyLabel(category.name);
          const categoryAuthor = categoryAuthors[normalizedCategoryName];
          return (
            <CategoryManagementCard
              key={category.id}
              category={category}
              isAdmin={isAdmin}
              author={categoryAuthor}
              fallbackWordImagePath={fallbackImagesByCategory.get(normalizedCategoryName)}
              editing={editing?.id === category.id}
              editName={editName}
              onEditNameChange={onEditNameChange}
              editColor={editColor}
              onEditColorChange={onEditColorChange}
              onEditImageChange={onEditImageChange}
              isSaving={isSaving}
              onEditingChange={onEditingChange}
              onStartEdit={onStartEdit}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          );
        })}
        {!managedCategories.length && <p className="category-empty-state"><ImagePlus className="mx-auto mb-2" size={22} />No categories yet.</p>}
      </div>
      {!!managedCategories.length && (
        <footer className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p aria-live="polite">Showing {firstVisibleCategory}–{lastVisibleCategory} of {managedCategories.length} categories</p>
          <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
            <label className="flex items-center gap-2 whitespace-nowrap"><span>Rows per page</span><select aria-label="Categories per page" value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))} className="h-10 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50">{categoryPageSizes.map((size) => <option key={size} value={size}>{size}</option>)}</select></label>
            <div className="flex items-center gap-2"><span className="whitespace-nowrap">Page {currentPage} of {pageCount}</span><Button type="button" variant="secondary" aria-label="Previous category page" onClick={pageNavigation.previousPage} disabled={currentPage <= 1} className="size-10 px-0"><ChevronLeft size={17} /></Button><Button type="button" variant="secondary" aria-label="Next category page" onClick={pageNavigation.nextPage} disabled={currentPage >= pageCount} className="size-10 px-0"><ChevronRight size={17} /></Button></div>
          </div>
        </footer>
      )}
    </div>
  );
}
