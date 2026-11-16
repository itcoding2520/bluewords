import type { CommunityWord } from "@/lib/supabase/community-vocabulary";
import { matchesVocabularyCategory } from "@/lib/vocabulary/category-filter";
import { createVocabularySearchMatcher } from "@/lib/vocabulary/search";
import { getFirstImageByKey } from "@/lib/vocabulary/first-image-by-key";

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
  return getFirstImageByKey(
    visibleWords,
    (item) => item.community_categories.name,
    (item) => item.image_path,
  );
}
