import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryColor } from "@/config/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { isUncategorizedVocabularyCategory } from "@/lib/vocabulary/category-visibility";

export type VocabularyGameCategoryOption = {
  id: string;
  name: string;
  value: string;
  color: VocabularyCategoryColor;
  imagePath: string | null;
};

export function buildVocabularyGameCategoryOptions(
  categories: VocabularyCategoryRow[],
  words: VocabularyWord[],
  options: { useFirstWordImageForAll: boolean },
): VocabularyGameCategoryOption[] {
  let firstWordImage: string | null = null;
  const wordImagesByCategory = new Map<string, string>();

  for (const word of words) {
    if (!word.imagePath) continue;
    firstWordImage ??= word.imagePath;
    if (word.category && !wordImagesByCategory.has(word.category)) {
      wordImagesByCategory.set(word.category, word.imagePath);
    }
  }

  const categoryOptions: VocabularyGameCategoryOption[] = [{
    id: "all-categories",
    name: "All categories",
    value: "all",
    color: "blue",
    imagePath: options.useFirstWordImageForAll ? firstWordImage : null,
  }];
  for (const item of categories) {
    if (isUncategorizedVocabularyCategory(item.name)) continue;
    categoryOptions.push({
      id: item.id,
      name: item.name,
      value: item.name,
      color: item.color,
      imagePath: item.image_path
        ? `category:${item.image_path}`
        : wordImagesByCategory.get(item.name) ?? null,
    });
  }
  return categoryOptions;
}
