import { useMemo } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { useVocabularyDropdownCategories } from "@/hooks/useVocabularyDropdownCategories";
import { buildWordMatchPairs } from "@/lib/word-match";

export function useWordMatchSetupData({
  words,
  categories,
  category,
}: {
  words: VocabularyWord[];
  categories: VocabularyCategoryRow[];
  category: string;
}) {
  const availablePairs = useMemo(
    () => buildWordMatchPairs(words, category),
    [category, words],
  );
  const categoryDropdownCategories = useVocabularyDropdownCategories(categories, words);

  return { availablePairs, categoryDropdownCategories };
}
