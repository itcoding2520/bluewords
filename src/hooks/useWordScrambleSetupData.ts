import { useMemo } from "react";
import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { useVocabularyDropdownCategories } from "@/hooks/useVocabularyDropdownCategories";
import { buildWordScrambleCandidates } from "@/lib/word-scramble";

export function useWordScrambleSetupData({
  words,
  categories,
  category,
}: {
  words: VocabularyWord[];
  categories: VocabularyCategoryRow[];
  category: string;
}) {
  const candidates = useMemo(
    () => buildWordScrambleCandidates(words, category),
    [category, words],
  );
  const categoryDropdownCategories = useVocabularyDropdownCategories(categories, words);

  return { candidates, categoryDropdownCategories };
}
