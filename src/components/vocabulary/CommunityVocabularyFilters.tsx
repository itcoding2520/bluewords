import { ChevronDown } from "lucide-react";

export function CommunityVocabularyFilters({
  categories,
  category,
  onCategoryChange,
  search,
  onSearchChange,
}: {
  categories: string[];
  category: string;
  onCategoryChange: (category: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
}) {
  return (
    <div className="community-vocabulary-controls mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <div className="community-category-select">
        <select
          aria-label="Community category"
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
          className="community-category-select-input rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
        >
          <option value="all">All shared categories</option>
          {categories.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
        <ChevronDown className="community-category-chevron" size={17} aria-hidden="true" />
      </div>
      <input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search shared words or meanings"
        aria-label="Search community vocabulary"
        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
      />
    </div>
  );
}
