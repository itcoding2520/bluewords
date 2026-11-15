import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { defaultVocabularyCategories, defaultVocabularyWords } from "@/data/default-vocabulary";

export interface CommunityCategoryRequest {
  id: string;
  owner_id: string;
  name: string;
  status: string;
}

export interface CommunityWordRequest {
  id: string;
  owner_id: string;
  category_id: string;
  normalized_word: string;
  word: string;
  meaning: string;
  ipa: string | null;
  category_name: string;
  status: string;
}

export function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export function getPublishVocabularyOptions(input: {
  categories: VocabularyCategoryRow[];
  words: VocabularyWord[];
  categoryRequests: CommunityCategoryRequest[];
  wordRequests: CommunityWordRequest[];
}) {
  const { categories, words, categoryRequests, wordRequests } = input;
  const defaultCategoryNames = new Set(defaultVocabularyCategories.map((item) => normalize(item.name)));
  const communityCategoryNames = new Map(categoryRequests.map((item) => [item.id, normalize(item.name)]));
  const ownCommunityCategoryIds = new Set(categoryRequests
    .filter((item) => item.owner_id && item.status !== "removed")
    .map((item) => item.id));
  const blockedCategoryNames = new Set(categoryRequests
    .filter((item) => item.status === "pending" || item.status === "published")
    .map((item) => normalize(item.name)));
  const userCategories = categories.filter((item) => {
    const normalizedName = normalize(item.name);
    const isOwnedCommunityCategory = !item.id.startsWith("community-category-")
      || ownCommunityCategoryIds.has(item.id.slice("community-category-".length));
    return !item.is_default
      && !defaultCategoryNames.has(normalizedName)
      && isOwnedCommunityCategory
      && !blockedCategoryNames.has(normalizedName);
  });
  const visibleCategoryNames = new Set(userCategories.map((item) => normalize(item.name)));
  const rejectedCategoryFallbacks = categoryRequests
    .filter((item) => item.owner_id
      && item.status === "rejected"
      && !defaultCategoryNames.has(normalize(item.name))
      && !visibleCategoryNames.has(normalize(item.name)))
    .map((item) => ({ id: `retry-category-${item.id}`, name: item.name, color: "blue" }));
  const requestableCategories = [...userCategories, ...rejectedCategoryFallbacks];
  const userCategoryNames = new Set(requestableCategories.map((item) => normalize(item.name)));
  const defaultWordKeys = new Set(defaultVocabularyWords.map((item) =>
    `${normalize(item.category)}\u0000${normalize(item.word)}`
  ));
  const ownCommunityCategoryNames = new Set(categoryRequests
    .filter((item) => item.owner_id && item.status !== "removed")
    .map((item) => normalize(item.name)));
  const blockedWordKeys = new Set(wordRequests
    .filter((item) => item.status === "pending" || item.status === "published")
    .flatMap((item) => {
      const categoryName = communityCategoryNames.get(item.category_id);
      return categoryName ? [`${categoryName}\u0000${normalize(item.normalized_word)}`] : [];
    }));
  const personalWordKeys = new Set(words.map((item) =>
    `${normalize(item.category)}\u0000${normalize(item.word)}`
  ));
  const rejectedWordFallbacks = wordRequests
    .filter((item) => item.status === "rejected"
      && item.owner_id
      && !personalWordKeys.has(`${normalize(item.category_name)}\u0000${normalize(item.word)}`))
    .map((item) => ({
      id: `retry-word-${item.id}`,
      word: item.word,
      meaning: item.meaning,
      category: item.category_name,
      ipa: item.ipa,
    }));
  const requestableWords = [...words, ...rejectedWordFallbacks];
  const userWords = requestableWords.filter((item) => {
    if (item.id.startsWith("community-")) return false;
    const categoryKey = normalize(item.category);
    const wordKey = `${categoryKey}\u0000${normalize(item.word)}`;
    return !defaultWordKeys.has(wordKey)
      && (userCategoryNames.has(categoryKey)
        || ownCommunityCategoryNames.has(categoryKey)
        || defaultCategoryNames.has(categoryKey))
      && !blockedWordKeys.has(wordKey);
  });

  return {
    defaultCategoryNames,
    communityCategoryNames,
    defaultWordKeys,
    requestableCategories,
    requestableWords,
    userWords,
  };
}
