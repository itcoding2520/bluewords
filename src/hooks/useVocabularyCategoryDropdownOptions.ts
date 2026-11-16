import { useMemo } from "react";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import type { VocabularyWord } from "@/data/vocabulary";
import type { CategoryDropdownOption } from "@/lib/vocabulary/category-dropdown-types";
import { useCategoryFallbackWordImages } from "@/hooks/useCategoryFallbackWordImages";
import { getFirstVocabularyCategoriesByName } from "@/lib/vocabulary/category-index";

export function useVocabularyCategoryDropdownOptions(input: {
  categories: VocabularyCategoryRow[];
  words: VocabularyWord[];
  category: string;
  includeAll: boolean;
  allLabel: string;
  customOptions?: CategoryDropdownOption[];
}) {
  const categoriesByName = useMemo(() => {
    return getFirstVocabularyCategoriesByName(input.categories);
  }, [input.categories]);

  const wordImagesByCategory = useCategoryFallbackWordImages(input.words);

  const options = useMemo(() => [
    ...(input.includeAll
      ? [{ id: "all-categories", name: input.allLabel, value: "all", color: null }]
      : []),
    ...(input.customOptions ?? input.categories.map((item) => ({ ...item, value: item.name }))),
  ], [input.allLabel, input.categories, input.customOptions, input.includeAll]);

  const selectedOption = options.find((item) => item.value === input.category);
  const selectedCategory = selectedOption?.color
    ? categoriesByName.get(selectedOption.name)
    : undefined;

  return { categoriesByName, wordImagesByCategory, options, selectedOption, selectedCategory };
}
