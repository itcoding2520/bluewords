import { BookOpen, Search } from "lucide-react";

import { CategoryAvatar } from "@/components/vocabulary/CategoryAvatar";
import { formatShortDate } from "@/lib/formatDate";
import type { CategoryTab, CommunityCategory } from "@/lib/admin-category-data";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";

type AdminCategory = VocabularyCategoryRow | CommunityCategory;

interface AdminCategoryListRow {
  category: AdminCategory;
  shared?: CommunityCategory | null;
  owner: string | null;
  fallbackImage?: string | null;
  defaultWordCount: number | null;
  createdAt: string | null;
}

interface AdminCategoryListPanelProps {
  activeTab: CategoryTab;
  loading: boolean;
  categorySearch: string;
  currentCategories: AdminCategory[];
  visibleCategories: AdminCategory[];
  visibleCategoryRows: AdminCategoryListRow[];
  selectedCategory: AdminCategory | null;
  onSearchChange: (value: string) => void;
  onSelect: (id: string) => void;
}

const tabLabel: Record<CategoryTab, string> = {
  default: "Default",
  published: "Custom published",
  pending: "Custom waiting publish",
};

export function AdminCategoryListPanel({
  activeTab,
  loading,
  categorySearch,
  currentCategories,
  visibleCategories,
  visibleCategoryRows,
  selectedCategory,
  onSearchChange,
  onSelect,
}: AdminCategoryListPanelProps) {
  return (
    <section className="admin-category-list-panel overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="admin-category-list-heading">
        <h2><BookOpen size={19} />{tabLabel[activeTab]} categories</h2>
      </div>
      <label className="admin-category-search">
        <Search size={17} />
        <input
          value={categorySearch}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search categories…"
          aria-label="Search categories"
        />
      </label>

      {loading ? (
        <p className="p-5 text-sm text-slate-500">Loading categories…</p>
      ) : visibleCategories.length === 0 ? (
        <p className="p-5 text-sm text-slate-500">
          {currentCategories.length ? "No categories match your search." : "No categories in this tab yet."}
        </p>
      ) : (
        <ul className="admin-category-list max-h-[65vh] divide-y divide-slate-100 overflow-y-auto">
          {visibleCategoryRows.map(({ category, shared, owner, fallbackImage, defaultWordCount, createdAt }) => {
            const active = category.id === selectedCategory?.id;
            return (
              <li key={category.id}>
                <button
                  type="button"
                  onClick={() => onSelect(category.id)}
                  aria-current={active ? "true" : undefined}
                  className={`admin-category-list-item flex w-full items-start gap-3 px-4 py-3 text-left transition ${active ? "is-selected bg-blue-50" : "hover:bg-slate-50"}`}
                >
                  <CategoryAvatar
                    name={category.name}
                    imagePath={shared?.image_path}
                    fallbackWordImagePath={fallbackImage}
                    colorClass={active ? "bg-blue-100" : "bg-slate-200"}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900">{category.name}</span>
                    {owner && <span className="mt-1 block truncate text-xs text-slate-500">{owner}</span>}
                  </span>
                  <span className="mt-1 text-xs text-slate-400">
                    {defaultWordCount ?? (createdAt ? formatShortDate(createdAt, "Date unavailable") : "")}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
