import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import type { CommunityCategoryRequest, CommunityWordRequest } from "@/lib/supabase/publish-vocabulary-request-types";
import { defaultVocabularyCategories, defaultVocabularyWords } from "@/data/default-vocabulary";
import { normalizeVocabularyText } from "@/lib/vocabulary/normalize-text";

export type { CommunityCategoryRequest, CommunityWordRequest } from "@/lib/supabase/publish-vocabulary-request-types";

export function getPublishVocabularyOptions(input: {
  categories: VocabularyCategoryRow[];
  words: VocabularyWord[];
  categoryRequests: CommunityCategoryRequest[];
  wordRequests: CommunityWordRequest[];
}) {
  const { categories, words, categoryRequests, wordRequests } = input;
  const defaultCategoryNames = new Set(defaultVocabularyCategories.map((item) => normalizeVocabularyText(item.name)));
  const communityCategoryNames = new Map(categoryRequests.map((item) => [item.id, normalizeVocabularyText(item.name)]));
  const ownCommunityCategoryIds = new Set(categoryRequests
    .filter((item) => item.owner_id && item.status !== "removed")
    .map((item) => item.id));
  const blockedCategoryNames = new Set(categoryRequests
    .filter((item) => item.status === "pending" || item.status === "published")
    .map((item) => normalizeVocabularyText(item.name)));
  const userCategories = categories.filter((item) => {
    const normalizedName = normalizeVocabularyText(item.name);
    const isOwnedCommunityCategory = !item.id.startsWith("community-category-")
      || ownCommunityCategoryIds.has(item.id.slice("community-category-".length));
    return !item.is_default
      && !defaultCategoryNames.has(normalizedName)
      && isOwnedCommunityCategory
      && !blockedCategoryNames.has(normalizedName);
  });
  const visibleCategoryNames = new Set(userCategories.map((item) => normalizeVocabularyText(item.name)));
  const rejectedCategoryFallbacks = categoryRequests
    .filter((item) => item.owner_id
      && item.status === "rejected"
      && !defaultCategoryNames.has(normalizeVocabularyText(item.name))
      && !visibleCategoryNames.has(normalizeVocabularyText(item.name)))
    .map((item) => ({ id: `retry-category-${item.id}`, name: item.name, color: "blue" }));
  const requestableCategories = [...userCategories, ...rejectedCategoryFallbacks];
  const userCategoryNames = new Set(requestableCategories.map((item) => normalizeVocabularyText(item.name)));
  const defaultWordKeys = new Set(defaultVocabularyWords.map((item) =>
    `${normalizeVocabularyText(item.category)}\u0000${normalizeVocabularyText(item.word)}`
  ));
  const ownCommunityCategoryNames = new Set(categoryRequests
    .filter((item) => item.owner_id && item.status !== "removed")
    .map((item) => normalizeVocabularyText(item.name)));
  const blockedWordKeys = new Set(wordRequests
    .filter((item) => item.status === "pending" || item.status === "published")
    .flatMap((item) => {
      const categoryName = communityCategoryNames.get(item.category_id);
      return categoryName ? [`${categoryName}\u0000${normalizeVocabularyText(item.normalized_word)}`] : [];
    }));
  const personalWordKeys = new Set(words.map((item) =>
    `${normalizeVocabularyText(item.category)}\u0000${normalizeVocabularyText(item.word)}`
  ));
  const rejectedWordFallbacks = wordRequests
    .filter((item) => item.status === "rejected"
      && item.owner_id
      && !personalWordKeys.has(`${normalizeVocabularyText(item.category_name)}\u0000${normalizeVocabularyText(item.word)}`))
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
    const categoryKey = normalizeVocabularyText(item.category);
    const wordKey = `${categoryKey}\u0000${normalizeVocabularyText(item.word)}`;
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
