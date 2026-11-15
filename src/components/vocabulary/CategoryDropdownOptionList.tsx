import type { KeyboardEvent, MutableRefObject } from "react";
import { Check, ListFilter } from "lucide-react";

import { CategoryAvatar } from "@/components/vocabulary/CategoryAvatar";
import type { VocabularyCategoryColor } from "@/config/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { CATEGORY_COLOR_STYLES, CATEGORY_TRIGGER_STYLES } from "@/components/vocabulary/category-dropdown-styles";
import { normalizeVocabularyLabel } from "@/lib/vocabulary/normalize-text";

export interface CategoryDropdownOption {
  id: string;
  name: string;
  value: string;
  color?: VocabularyCategoryColor | null;
}

interface CategoryDropdownOptionListProps {
  listboxId: string;
  listLabel: string;
  options: CategoryDropdownOption[];
  category: string;
  activeIndex: number;
  categoriesByName: Map<string, VocabularyCategoryRow>;
  wordImagesByCategory: Map<string, string>;
  optionRefs: MutableRefObject<Array<HTMLDivElement | null>>;
  setActiveIndex: (index: number) => void;
  chooseCategory: (value: string) => void;
  handleOptionKeyDown: (event: KeyboardEvent<HTMLDivElement>, index: number) => void;
}

export function CategoryDropdownOptionList({
  listboxId,
  listLabel,
  options,
  category,
  activeIndex,
  categoriesByName,
  wordImagesByCategory,
  optionRefs,
  setActiveIndex,
  chooseCategory,
  handleOptionKeyDown,
}: CategoryDropdownOptionListProps) {
  return (
    <div
      id={listboxId}
      role="listbox"
      aria-label={listLabel}
      className="hide-scrollbar absolute right-0 z-50 mt-2 max-h-72 w-full min-w-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 ring-1 ring-slate-950/5"
    >
      <div className="border-b border-slate-100 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        {listLabel}
      </div>
      {options.map((item, index) => {
        const isSelected = item.value === category;
        const isActive = index === activeIndex;
        const fallbackWordImagePath = wordImagesByCategory.get(normalizeVocabularyLabel(item.name));

        return (
          <div
            key={item.id}
            ref={(node) => { optionRefs.current[index] = node; }}
            role="option"
            aria-selected={isSelected}
            tabIndex={isActive ? 0 : -1}
            onClick={() => chooseCategory(item.value)}
            onFocus={() => setActiveIndex(index)}
            onKeyDown={(event) => handleOptionKeyDown(event, index)}
            className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors focus:outline-none ${
              isSelected && item.color
                ? `${CATEGORY_TRIGGER_STYLES[item.color]} font-semibold text-white`
                : isSelected
                  ? "bg-slate-950 font-semibold text-white"
                  : isActive
                    ? "bg-slate-50 text-slate-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              {item.color ? (
                <CategoryAvatar
                  name={item.name}
                  imagePath={categoriesByName.get(item.name)?.image_path}
                  fallbackWordImagePath={fallbackWordImagePath}
                  colorClass={CATEGORY_COLOR_STYLES[item.color]}
                />
              ) : (
                <ListFilter size={14} className={isSelected ? "text-white/90" : "text-slate-400"} aria-hidden="true" />
              )}
              <span className="truncate">{item.name}</span>
            </span>
            {isSelected && <Check size={15} aria-hidden="true" className="shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}
