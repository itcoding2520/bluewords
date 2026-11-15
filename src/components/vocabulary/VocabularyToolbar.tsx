import type { ReactNode } from "react";
import { Search, X } from "lucide-react";
import type { VocabularyCategory } from "@/config/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import type { VocabularyStatus, VocabularyWord } from "@/data/vocabulary";
import { CategoryDropdown } from "@/components/vocabulary/VocabularyCategoryDropdown";

export type CategoryFilter = "All" | VocabularyCategory;
export type VocabularyStatusFilter = "all" | VocabularyStatus;

interface VocabularyToolbarProps {
  search: string;
  category: CategoryFilter;
  status: VocabularyStatusFilter;
  categories: VocabularyCategoryRow[];
  words: VocabularyWord[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: CategoryFilter) => void;
  onStatusChange: (value: VocabularyStatusFilter) => void;
}

interface FilterButtonProps {
  children: ReactNode;
  active?: boolean;
  onClick: () => void;
}

function FilterButton({
  children,
  active = false,
  onClick,
}: FilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "shrink-0 whitespace-nowrap rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_5px_12px_rgb(37_99_235/0.2)]"
          : "cursor-pointer shrink-0 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
      }
    >
      {children}
    </button>
  );
}

export function VocabularyToolbar({
  search,
  category,
  status,
  categories,
  words,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
}: VocabularyToolbarProps) {
  return (
    <div className="vocabulary-filter-toolbar min-w-0 flex-1 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      {/* Search */}
      <div className="relative w-full min-w-0 lg:max-w-md lg:flex-1">
        <Search
          size={17}
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="text"
          aria-label="Search vocabulary"
          value={search}
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
          placeholder="Search vocabulary..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-11 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
        />

        {search.length > 0 && (
          <button
            type="button"
            aria-label="Clear search"
            title="Clear search"
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="flex min-w-0 w-full flex-wrap items-center gap-3 lg:w-auto lg:justify-end">
        <CategoryDropdown
          ariaLabel="Filter vocabulary by status"
          category={status}
          categories={[]}
          words={[]}
          includeAll
          allLabel="All words"
          listLabel="Choose a status"
          options={[
            { id: "status-learning", name: "Learning", value: "learning" },
            { id: "status-mastered", name: "Mastered", value: "mastered" },
          ]}
          onChange={(value) => onStatusChange(value as VocabularyStatusFilter)}
        />
        {/* Category filters */}
        <div
          role="group"
          aria-label="Filter vocabulary by category"
          className="flex min-w-0 flex-1 items-center gap-2 lg:flex-none"
        >
          <FilterButton
            active={category === "All"}
            onClick={() => onCategoryChange("All")}
          >
            All categories
          </FilterButton>

          <CategoryDropdown
            category={category}
            categories={categories}
            words={words}
            onChange={(value) => onCategoryChange(value as CategoryFilter)}
          />
        </div>
      </div>
    </div>
  );
}
