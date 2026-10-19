
import type { ReactNode } from "react";
import { Search, X } from "lucide-react";

import type { VocabularyCategory } from "@/config/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { Select } from "@/components/ui/Select";

export type CategoryFilter = "All" | VocabularyCategory;

interface VocabularyToolbarProps {
  search: string;
  category: CategoryFilter;
  categories: VocabularyCategoryRow[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: CategoryFilter) => void;
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
          ? "shrink-0 whitespace-nowrap rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white"
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
  categories,
  onSearchChange,
  onCategoryChange,
}: VocabularyToolbarProps) {
  return (
    <div className="mt-6 flex min-w-0 flex-col gap-4 lg:mt-10 lg:flex-row lg:items-center lg:justify-between">
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

      {/* Category filters */}
      <div className="min-w-0 w-full lg:w-auto">
        <div
          role="group"
          aria-label="Filter vocabulary by category"
          className="flex min-w-0 items-center gap-2"
        >
          <FilterButton
            active={category === "All"}
            onClick={() => onCategoryChange("All")}
          >
            All
          </FilterButton>

          <div className="min-w-0 max-w-[240px] flex-1">
            <Select
              aria-label="Filter vocabulary by category"
              value={category === "All" ? "" : category}
              onChange={(event) =>
                onCategoryChange(event.target.value as CategoryFilter)
              }
              className="min-w-0 px-3 py-2.5 pr-9 text-sm"
            >
              <option value="" disabled>Select category</option>
              {categories.map((item) => (
                <option key={item.id} value={item.name}>{item.name}</option>
              ))}
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
