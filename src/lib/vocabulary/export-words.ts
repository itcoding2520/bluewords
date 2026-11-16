import type { VocabularyWord } from "@/data/vocabulary";
import { getVocabularyWordsForCategory } from "@/lib/supabase/vocabulary";
import { mapVocabularyWordRow } from "@/lib/vocabulary/shared-vocabulary";

export async function loadVocabularyExportWords(
  selectedCategory: string,
  currentPageWords: VocabularyWord[],
): Promise<VocabularyWord[]> {
  if (selectedCategory === "All") return currentPageWords;

  const rows = await getVocabularyWordsForCategory(selectedCategory);
  return rows.map(mapVocabularyWordRow);
}
