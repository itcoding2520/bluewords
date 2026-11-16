import { useMemo } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { useVocabularyDropdownCategories } from "@/hooks/useVocabularyDropdownCategories";
import { getPrimaryVocabularyMeaning } from "@/lib/vocabulary/meaning";
import { matchesVocabularyCategory } from "@/lib/vocabulary/category-filter";

export function useWordMazeSetupData({
  words,
  categories,
  category,
}: {
  words: VocabularyWord[];
  categories: VocabularyCategoryRow[];
  category: string;
}) {
  const candidates = useMemo(() => {
    const meanings = new Set<string>();
    const result: VocabularyWord[] = [];
    for (const word of words) {
      const meaning = getPrimaryVocabularyMeaning(word);
      const key = meaning.toLocaleLowerCase();
      if (!meaning || !matchesVocabularyCategory(word.category, category) || meanings.has(key)) continue;
      meanings.add(key);
      result.push(word);
    }
    return result;
  }, [category, words]);
  const categoryDropdownCategories = useVocabularyDropdownCategories(categories, words, true);

  return { candidates, categoryDropdownCategories };
}
