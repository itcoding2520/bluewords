import { useId } from "react";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import type { VocabularyWord } from "@/data/vocabulary";
import { useVocabularyCategoryDropdownController } from "@/hooks/useVocabularyCategoryDropdownController";
import { CategoryDropdownOptionList, type CategoryDropdownOption } from "@/components/vocabulary/CategoryDropdownOptionList";
import { VocabularyCategoryDropdownTrigger } from "@/components/vocabulary/VocabularyCategoryDropdownTrigger";
import { useVocabularyCategoryDropdownOptions } from "@/hooks/useVocabularyCategoryDropdownOptions";
import { normalizeVocabularyLabel } from "@/lib/vocabulary/normalize-text";
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
  const {
    categoriesByName,
    wordImagesByCategory,
    options,
    selectedOption,
    selectedCategory,
  } = useVocabularyCategoryDropdownOptions({
    categories,
    words,
    category,
    includeAll,
    allLabel,
    customOptions,
  });
  const getFallbackImage = (name: string) =>
    wordImagesByCategory.get(normalizeVocabularyLabel(name));
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
      <VocabularyCategoryDropdownTrigger
        id={id}
        triggerRef={triggerRef}
        ariaLabel={ariaLabel}
        listboxId={listboxId}
        isOpen={isOpen}
        selectedCategory={selectedCategory}
        selectedName={selectedOption?.name}
        fallbackWordImagePath={selectedCategory ? getFallbackImage(selectedCategory.name) : undefined}
        onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
        onKeyDown={handleTriggerKeyDown}
      />

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
