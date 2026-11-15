import { useId, useMemo } from "react";
import { Check, ChevronDown, ListFilter } from "lucide-react";
import type { VocabularyCategoryColor, VocabularyCategoryRow } from "@/lib/supabase/categories";
import type { VocabularyWord } from "@/data/vocabulary";
import { CategoryAvatar } from "@/components/vocabulary/CategoryAvatar";
import { useVocabularyCategoryDropdownController } from "@/hooks/useVocabularyCategoryDropdownController";
export { getVocabularyDropdownCategories } from "@/lib/vocabulary/category-dropdown";

const CATEGORY_COLOR_STYLES: Record<VocabularyCategoryColor, string> = {
  blue: "bg-blue-700",
  violet: "bg-[#bf00ff]",
  orange: "bg-[#ff990a]",
  green: "bg-emerald-700",
  rose: "bg-rose-700",
  indigo: "bg-indigo-700",
  teal: "bg-teal-700",
  amber: "bg-amber-700",
  pink: "bg-pink-700",
  slate: "bg-slate-700",
};

const CATEGORY_TRIGGER_STYLES: Record<VocabularyCategoryColor, string> = {
  blue: "border-blue-700 bg-blue-700 hover:border-blue-800 hover:bg-blue-800",
  violet: "border-[#bf00ff] bg-[#bf00ff] hover:brightness-95",
  orange: "border-[#ff990a] bg-[#ff990a] hover:brightness-95",
  green: "border-emerald-700 bg-emerald-700 hover:border-emerald-800 hover:bg-emerald-800",
  rose: "border-rose-700 bg-rose-700 hover:border-rose-800 hover:bg-rose-800",
  indigo: "border-indigo-700 bg-indigo-700 hover:border-indigo-800 hover:bg-indigo-800",
  teal: "border-teal-700 bg-teal-700 hover:border-teal-800 hover:bg-teal-800",
  amber: "border-amber-700 bg-amber-700 hover:border-amber-800 hover:bg-amber-800",
  pink: "border-pink-700 bg-pink-700 hover:border-pink-800 hover:bg-pink-800",
  slate: "border-slate-700 bg-slate-700 hover:border-slate-800 hover:bg-slate-800",
};

interface CategoryDropdownProps {
  id?: string;
  ariaLabel?: string;
  className?: string;
  category: string;
  categories: VocabularyCategoryRow[];
  words: VocabularyWord[];
  onChange: (value: string) => void;
  includeAll?: boolean;
  allLabel?: string;
  listLabel?: string;
  options?: Array<{
    id: string;
    name: string;
    value: string;
    color?: VocabularyCategoryColor | null;
  }>;
  fullWidth?: boolean;
}

export function CategoryDropdown({
  id,
  ariaLabel = "Filter vocabulary by category",
  className = "",
  category,
  categories,
  words,
  onChange,
  includeAll = false,
  allLabel = "All categories",
  listLabel = "Choose a category",
  options: customOptions,
  fullWidth = false,
}: CategoryDropdownProps) {
  const listboxId = useId();
  const categoriesByName = useMemo(() => {
    const byName = new Map<string, VocabularyCategoryRow>();
    for (const item of categories) {
      if (!byName.has(item.name)) byName.set(item.name, item);
    }
    return byName;
  }, [categories]);
  const wordImagesByCategory = useMemo(() => {
    const images = new Map<string, string>();
    for (const word of words) {
      const key = word.category.trim().toLocaleLowerCase();
      if (!images.has(key) && word.imagePath) images.set(key, word.imagePath);
    }
    return images;
  }, [words]);
  const getFallbackImage = (name: string) =>
    wordImagesByCategory.get(name.trim().toLocaleLowerCase());
  const options: Array<{
    id: string;
    name: string;
    value: string;
    color?: VocabularyCategoryColor | null;
  }> = [
    ...(includeAll
      ? [{ id: "all-categories", name: allLabel, value: "all", color: null }]
      : []),
    ...(customOptions ?? categories.map((item) => ({ ...item, value: item.name }))),
  ];
  const selectedOption = options.find((item) => item.value === category);
  const selectedCategory = selectedOption?.color
    ? categoriesByName.get(selectedOption.name)
    : undefined;
  const {
    isOpen,
    setIsOpen,
    activeIndex,
    setActiveIndex,
    rootRef,
    triggerRef,
    optionRefs,
    openMenu,
    chooseCategory,
    handleTriggerKeyDown,
    handleOptionKeyDown,
  } = useVocabularyCategoryDropdownController({ category, options, onChange });

  return (
    <div
      ref={rootRef}
      className={`relative min-w-0 ${fullWidth ? "w-full max-w-none flex-none" : "max-w-[240px] flex-1"} ${className}`}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        id={id}
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
        onKeyDown={handleTriggerKeyDown}
        className={`group flex h-11 w-full cursor-pointer items-center gap-2.5 rounded-xl border px-3 text-left text-sm font-medium shadow-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 ${
          selectedCategory
            ? `${CATEGORY_TRIGGER_STYLES[selectedCategory.color]} text-white focus-visible:ring-blue-200`
            : "border-blue-100 bg-blue-50/70 text-slate-700 hover:border-blue-200 hover:bg-blue-50"
        }`}
      >
        {selectedCategory ? <CategoryAvatar name={selectedCategory.name} imagePath={selectedCategory.image_path} fallbackWordImagePath={getFallbackImage(selectedCategory.name)} colorClass={CATEGORY_COLOR_STYLES[selectedCategory.color]} /> : <span className={`grid size-7 shrink-0 place-items-center rounded-lg shadow-sm ring-1 ${
          selectedCategory
            ? "bg-white/20 text-white ring-white/20"
            : "bg-white text-blue-600 ring-blue-100"
        }`}>
          <ListFilter size={15} aria-hidden="true" />
        </span>}
        <span className="min-w-0 flex-1 truncate">
          {selectedOption?.name ?? "Select category"}
        </span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`shrink-0 transition-transform duration-200 ${
            selectedCategory ? "text-white/90" : "text-slate-500"
          } ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
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
            const itemColor = item.color;

            return (
              <div
                key={item.id}
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                role="option"
                aria-selected={isSelected}
                tabIndex={isActive ? 0 : -1}
                onClick={() => chooseCategory(item.value)}
                onFocus={() => setActiveIndex(index)}
                onKeyDown={(event) => handleOptionKeyDown(event, index)}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors focus:outline-none ${
                  isSelected && itemColor
                    ? `${CATEGORY_TRIGGER_STYLES[itemColor]} font-semibold text-white`
                    : isSelected
                      ? "bg-slate-950 font-semibold text-white"
                    : isActive
                      ? "bg-slate-50 text-slate-900"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  {itemColor ? (
                    <CategoryAvatar name={item.name} imagePath={categoriesByName.get(item.name)?.image_path} fallbackWordImagePath={getFallbackImage(item.name)} colorClass={CATEGORY_COLOR_STYLES[itemColor]} />
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
      )}
    </div>
  );
}
