import type { CommunityWord } from "@/lib/supabase/community-vocabulary";
import { matchesVocabularyCategory } from "@/lib/vocabulary/category-filter";
import { createVocabularySearchMatcher } from "@/lib/vocabulary/search";

export function getCommunityVocabularyCategories(words: CommunityWord[]): string[] {
  return [...new Set(words.map((item) => item.community_categories.name))]
    .sort((a, b) => a.localeCompare(b));
}

export function filterCommunityVocabularyWords(
  words: CommunityWord[],
  category: string,
  search: string,
): CommunityWord[] {
  const matchesSearch = createVocabularySearchMatcher(search);
  return words.filter((item) =>
    matchesVocabularyCategory(item.community_categories.name, category)
    && matchesSearch(item.word, item.meaning)
  );
}

export function getCommunityVocabularyFallbackImages(
  visibleWords: CommunityWord[],
): Map<string, string> {
  const images = new Map<string, string>();
  for (const item of visibleWords) {
    const categoryName = item.community_categories.name;
    if (item.image_path && !images.has(categoryName)) {
      images.set(categoryName, item.image_path);
    }
  }
  return images;
}
