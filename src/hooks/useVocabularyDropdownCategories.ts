import { useMemo } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { getVocabularyDropdownCategories } from "@/lib/vocabulary/category-dropdown";

export function useVocabularyDropdownCategories(
  categories: VocabularyCategoryRow[],
  words: VocabularyWord[],
  includeUncategorized = false
) {
  return useMemo(
    () => getVocabularyDropdownCategories(categories, words, includeUncategorized),
    [categories, includeUncategorized, words]
  );
}
