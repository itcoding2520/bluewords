import { useMemo } from "react";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import type { VocabularyWord } from "@/data/vocabulary";
import type { CategoryDropdownOption } from "@/lib/vocabulary/category-dropdown-types";
import { normalizeVocabularyLabel } from "@/lib/vocabulary/normalize-text";

export function useVocabularyCategoryDropdownOptions(input: {
  categories: VocabularyCategoryRow[];
  words: VocabularyWord[];
  category: string;
  includeAll: boolean;
  allLabel: string;
  customOptions?: CategoryDropdownOption[];
}) {
  const categoriesByName = useMemo(() => {
    const byName = new Map<string, VocabularyCategoryRow>();
    for (const item of input.categories) {
      if (!byName.has(item.name)) byName.set(item.name, item);
    }
    return byName;
  }, [input.categories]);

  const wordImagesByCategory = useMemo(() => {
    const images = new Map<string, string>();
    for (const word of input.words) {
      const key = normalizeVocabularyLabel(word.category);
      if (!images.has(key) && word.imagePath) images.set(key, word.imagePath);
    }
    return images;
  }, [input.words]);

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
