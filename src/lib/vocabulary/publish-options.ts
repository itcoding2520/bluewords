import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { defaultVocabularyCategories, defaultVocabularyWords } from "@/data/default-vocabulary";
import { getVocabularyTextPairKey, normalizeVocabularyText } from "@/lib/vocabulary/normalize-text";
import { getCommunityCategoryId, isCommunityCategoryId } from "@/lib/vocabulary/community-category-id";
import type { CommunityCategoryRequest, CommunityWordRequest } from "@/lib/supabase/publish-vocabulary-request-types";

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
    const isOwnedCommunityCategory = !isCommunityCategoryId(item.id)
      || ownCommunityCategoryIds.has(getCommunityCategoryId(item.id) ?? "");
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
    getVocabularyTextPairKey(item.category, item.word)
  ));
  const ownCommunityCategoryNames = new Set(categoryRequests
    .filter((item) => item.owner_id && item.status !== "removed")
    .map((item) => normalizeVocabularyText(item.name)));
  const blockedWordKeys = new Set(wordRequests
    .filter((item) => item.status === "pending" || item.status === "published")
    .flatMap((item) => {
      const categoryName = communityCategoryNames.get(item.category_id);
      return categoryName ? [getVocabularyTextPairKey(categoryName, item.normalized_word)] : [];
    }));
  const personalWordKeys = new Set(words.map((item) =>
    getVocabularyTextPairKey(item.category, item.word)
  ));
  const rejectedWordFallbacks = wordRequests
    .filter((item) => item.status === "rejected"
      && item.owner_id
      && !personalWordKeys.has(getVocabularyTextPairKey(item.category_name, item.word)))
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
    const wordKey = getVocabularyTextPairKey(categoryKey, item.word);
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
