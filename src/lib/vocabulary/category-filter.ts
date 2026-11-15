export function matchesVocabularyCategory(itemCategory: string, selectedCategory: string): boolean {
  return selectedCategory === "all" || itemCategory === selectedCategory;
}
