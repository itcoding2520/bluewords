import { defaultVocabularyCategories } from "@/data/default-vocabulary";
import { normalizeVocabularyLabel } from "@/lib/vocabulary/normalize-text";

const defaultCategoryNames = new Set(
  defaultVocabularyCategories.map((category) => normalizeVocabularyLabel(category.name)),
);

export function isDefaultVocabularyCategory(name: string) {
  return defaultCategoryNames.has(normalizeVocabularyLabel(name));
}
