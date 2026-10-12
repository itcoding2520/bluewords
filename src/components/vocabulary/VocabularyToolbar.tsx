
import type { ReactNode } from "react";
import { Search } from "lucide-react";

import {
  VOCABULARY_CATEGORIES,
  type VocabularyCategory,
} from "@/config/vocabulary";

export type CategoryFilter = "All" | VocabularyCategory;

interface VocabularyToolbarProps {
  search: string;
  category: CategoryFilter;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: CategoryFilter) => void;
}

const filters: CategoryFilter[] = [
  "All",
  ...VOCABULARY_CATEGORIES,
];

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
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="search"
          aria-label="Search vocabulary"
          value={search}
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
          placeholder="Search vocabulary..."
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
        />
      </div>

      {/* Category filters */}
      <div className="min-w-0 w-full lg:w-auto">
        <div
          role="group"
          aria-label="Filter vocabulary by category"
          className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0"
        >
          {filters.map((item) => (
            <FilterButton
              key={item}
              active={category === item}
              onClick={() => onCategoryChange(item)}
            >
              {item}
            </FilterButton>
          ))}
        </div>
      </div>
    </div>
  );
}
