import { useId, useMemo } from "react";
import { ChevronDown, ListFilter } from "lucide-react";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import type { VocabularyWord } from "@/data/vocabulary";
import { CategoryAvatar } from "@/components/vocabulary/CategoryAvatar";
import { useVocabularyCategoryDropdownController } from "@/hooks/useVocabularyCategoryDropdownController";
import { CategoryDropdownOptionList, type CategoryDropdownOption } from "@/components/vocabulary/CategoryDropdownOptionList";
import { CATEGORY_COLOR_STYLES, CATEGORY_TRIGGER_STYLES } from "@/components/vocabulary/category-dropdown-styles";
export { getVocabularyDropdownCategories } from "@/lib/vocabulary/category-dropdown";

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
  options?: CategoryDropdownOption[];
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
  const options: CategoryDropdownOption[] = [
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

      {isOpen && <CategoryDropdownOptionList
        listboxId={listboxId}
        listLabel={listLabel}
        options={options}
        category={category}
        activeIndex={activeIndex}
        categoriesByName={categoriesByName}
        wordImagesByCategory={wordImagesByCategory}
        optionRefs={optionRefs}
        setActiveIndex={setActiveIndex}
        chooseCategory={chooseCategory}
        handleOptionKeyDown={handleOptionKeyDown}
      />}
    </div>
  );
}
