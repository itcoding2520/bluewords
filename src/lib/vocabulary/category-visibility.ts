import { normalizeVocabularyKey } from "@/lib/vocabulary/normalize-text";

export function isUncategorizedVocabularyCategory(name: string): boolean {
  return normalizeVocabularyKey(name) === "uncategorized";
}
