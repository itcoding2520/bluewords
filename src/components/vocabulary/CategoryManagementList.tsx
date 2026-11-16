import type { FormEvent } from "react";
import { Check, ChevronLeft, ChevronRight, ImagePlus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryColor } from "@/config/vocabulary";
import { vocabularyCategoryColorOptions } from "@/components/vocabulary/VocabularyCategoryColorSelect";
import { CATEGORY_DOT_STYLES } from "@/components/vocabulary/category-dropdown-styles";
import { CategoryAvatar } from "@/components/vocabulary/CategoryAvatar";
import { ActionMenu } from "@/components/ui/ActionMenu";
import type { CategoryManagementFilter, CategoryManagementSort } from "@/hooks/useCategoryManagementController";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { normalizeVocabularyLabel } from "@/lib/vocabulary/normalize-text";
import { getNextPage, getPreviousPage } from "@/lib/pagination";

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
  isDefaultCategory,
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
  isDefaultCategory: (category: VocabularyCategoryRow) => boolean;
  onStartEdit: (category: VocabularyCategoryRow) => void;
  onUpdate: (event: FormEvent<HTMLFormElement>) => void;
  onDelete: (category: VocabularyCategoryRow) => void;
}) {
  return (
    <div className="category-list-panel">
      <div className="category-list-toolbar">
        <h2>{managedCategories.length} categories</h2>
        <label className="category-inline-filter">Filter by
          <Select aria-label="Filter categories" value={filterBy} onChange={(event) => onFilterChange(event.target.value as CategoryManagementFilter)}>
            <option value="all">All categories</option><option value="mine">By me</option><option value="default">Default</option><option value="community">Community</option>
          </Select>
        </label>
        <label className="category-inline-filter">Sort by
          <Select aria-label="Sort categories" value={sortBy} onChange={(event) => onSortChange(event.target.value as CategoryManagementSort)}>
            <option value="name">A → Z</option><option value="newest">Newest</option><option value="oldest">Oldest</option>
          </Select>
        </label>
      </div>
      <div className="category-card-grid">
        {pageCategories.map((category) => {
          const selectedColor = CATEGORY_DOT_STYLES[category.color];
          const isReadOnly = category.user_id === "community";
          const isProtectedDefault = isDefaultCategory(category);
          const isPublishedShared = category.id.startsWith("community-category-");
          const canManageCategory = isAdmin || (!isProtectedDefault && !isReadOnly && !isPublishedShared);

          return (
            <article key={category.id} className="category-item-card">
              {editing?.id === category.id ? (
                <form onSubmit={onUpdate} className="category-edit-form grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px_minmax(180px,0.8fr)_auto] sm:items-end">
                  <label className="grid gap-1.5 text-sm font-medium text-slate-700">Category name<Input value={editName} disabled={category.is_default} onChange={(event) => onEditNameChange(event.target.value)} maxLength={50} /></label>
                  <label className="grid gap-1.5 text-sm font-medium text-slate-700">Color<Select value={editColor} onChange={(event) => onEditColorChange(event.target.value as VocabularyCategoryColor)}>{vocabularyCategoryColorOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select></label>
                  <label className="grid gap-1.5 text-sm font-medium text-slate-700">{isProtectedDefault ? "Default category image" : "Change category image"}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={category.is_default && !isAdmin} onChange={(event) => onEditImageChange(event.target.files?.[0] ?? null)} className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs file:mr-2 file:rounded-md file:border-0 file:bg-blue-50 file:px-2 file:py-1 file:text-xs file:font-medium file:text-blue-700 disabled:opacity-50" /></label>
                  <div className="flex gap-2"><Button type="submit" disabled={isSaving}><Check size={16} /> Save</Button><Button type="button" variant="secondary" onClick={() => onEditingChange(null)} disabled={isSaving}><X size={16} /></Button></div>
                </form>
              ) : (
                <div className="category-item-content">
                  <CategoryAvatar name={category.name} imagePath={category.image_path} fallbackWordImagePath={words.find((word) => normalizeVocabularyLabel(word.category) === normalizeVocabularyLabel(category.name) && word.imagePath)?.imagePath} colorClass={selectedColor} sizeClass="size-20" shapeClass="rounded-2xl" />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{category.name}</p><p className="mt-1 text-xs text-slate-500">{isAdmin && categoryAuthors[normalizeVocabularyLabel(category.name)] ? `By ${categoryAuthors[normalizeVocabularyLabel(category.name)]}` : isReadOnly ? "Published community category" : category.is_default ? "Default category" : category.image_path ? "Custom image" : "Uses the first word image in games"}</p></div>
                  {canManageCategory && <ActionMenu label={category.name} disabled={isSaving} actions={[{ label: "Edit", icon: <Pencil size={15} />, onSelect: () => onStartEdit(category) }, ...(!category.is_default ? [{ label: "Remove", icon: <Trash2 size={15} />, onSelect: () => onDelete(category), destructive: true }] : [])]} />}
                </div>
              )}
            </article>
          );
        })}
        {!managedCategories.length && <p className="category-empty-state"><ImagePlus className="mx-auto mb-2" size={22} />No categories yet.</p>}
      </div>
      {!!managedCategories.length && (
        <footer className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p aria-live="polite">Showing {firstVisibleCategory}–{lastVisibleCategory} of {managedCategories.length} categories</p>
          <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
            <label className="flex items-center gap-2 whitespace-nowrap"><span>Rows per page</span><select aria-label="Categories per page" value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))} className="h-10 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50">{[10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}</select></label>
            <div className="flex items-center gap-2"><span className="whitespace-nowrap">Page {currentPage} of {pageCount}</span><Button type="button" variant="secondary" aria-label="Previous category page" onClick={() => onPageChange((value) => getPreviousPage(value))} disabled={currentPage <= 1} className="size-10 px-0"><ChevronLeft size={17} /></Button><Button type="button" variant="secondary" aria-label="Next category page" onClick={() => onPageChange((value) => getNextPage(value, pageCount))} disabled={currentPage >= pageCount} className="size-10 px-0"><ChevronRight size={17} /></Button></div>
          </div>
        </footer>
      )}
    </div>
  );
}
