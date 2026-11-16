import type { VocabularyWord } from "@/data/vocabulary";
import { defaultVocabularyCategories, defaultVocabularyWords } from "@/data/default-vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import type { CommunityCategoryRequest, CommunityWordRequest } from "@/lib/supabase/publish-vocabulary-request-types";
import { getCommunityCategoryId, isCommunityCategoryId } from "@/lib/vocabulary/community-category-id";
import { getVocabularyTextPairKey, normalizeVocabularyText } from "@/lib/vocabulary/normalize-text";

type CategoryRequestOptions = {
  communityCategoryNames: Map<string, string>;
  ownCommunityCategoryNames: Set<string>;
  requestableCategories: Array<VocabularyCategoryRow | { id: string; name: string; color: string }>;
  userCategoryNames: Set<string>;
};

function buildCategoryRequestOptions(
  categories: VocabularyCategoryRow[],
  requests: CommunityCategoryRequest[],
  defaultCategoryNames: Set<string>,
): CategoryRequestOptions {
  const normalizedRequests = requests.map((item) => ({ item, normalizedName: normalizeVocabularyText(item.name) }));
  const normalizedCategories = categories.map((item) => ({ item, normalizedName: normalizeVocabularyText(item.name) }));
  const communityCategoryNames = new Map(normalizedRequests.map(({ item, normalizedName }) => [item.id, normalizedName]));
  const ownCommunityCategoryIds = new Set<string>();
  const ownCommunityCategoryNames = new Set<string>();
  const blockedCategoryNames = new Set<string>();
  for (const { item, normalizedName } of normalizedRequests) {
    if (item.owner_id && item.status !== "removed") {
      ownCommunityCategoryIds.add(item.id);
      ownCommunityCategoryNames.add(normalizedName);
    }
    if (item.status === "pending" || item.status === "published") {
      blockedCategoryNames.add(normalizedName);
    }
  }
  const userCategoryEntries = normalizedCategories.filter(({ item, normalizedName }) => {
    const isOwnedCommunityCategory = !isCommunityCategoryId(item.id)
      || ownCommunityCategoryIds.has(getCommunityCategoryId(item.id) ?? "");
    return !item.is_default
      && !defaultCategoryNames.has(normalizedName)
      && isOwnedCommunityCategory
      && !blockedCategoryNames.has(normalizedName);
  });
  const userCategories = userCategoryEntries.map(({ item }) => item);
  const visibleCategoryNames = new Set(userCategoryEntries.map(({ normalizedName }) => normalizedName));
  const rejectedCategoryFallbacks = normalizedRequests
    .filter(({ item, normalizedName }) => item.owner_id
      && item.status === "rejected"
      && !defaultCategoryNames.has(normalizedName)
      && !visibleCategoryNames.has(normalizedName))
    .map(({ item }) => ({ id: `retry-category-${item.id}`, name: item.name, color: "blue" }));
  const requestableCategories = [...userCategories, ...rejectedCategoryFallbacks];
  const userCategoryNames = new Set([
    ...userCategoryEntries.map(({ normalizedName }) => normalizedName),
    ...rejectedCategoryFallbacks.map((item) => normalizeVocabularyText(item.name)),
  ]);

  return {
    communityCategoryNames,
    ownCommunityCategoryNames,
    requestableCategories,
    userCategoryNames,
  };
}

function buildWordRequestOptions(input: {
  words: VocabularyWord[];
  requests: CommunityWordRequest[];
  defaultCategoryNames: Set<string>;
  defaultWordKeys: Set<string>;
  communityCategoryNames: Map<string, string>;
  ownCommunityCategoryNames: Set<string>;
  userCategoryNames: Set<string>;
}) {
  const {
    words,
    requests,
    defaultCategoryNames,
    defaultWordKeys,
    communityCategoryNames,
    ownCommunityCategoryNames,
    userCategoryNames,
  } = input;
  const personalWordKeys = new Set(words.map((item) => getVocabularyTextPairKey(item.category, item.word)));
  const blockedWordKeys = new Set<string>();
  const rejectedWordFallbacks: Array<Pick<VocabularyWord, "id" | "word" | "meaning" | "category" | "ipa">> = [];
  for (const item of requests) {
    if (item.status === "pending" || item.status === "published") {
      const categoryName = communityCategoryNames.get(item.category_id);
      if (categoryName) blockedWordKeys.add(getVocabularyTextPairKey(categoryName, item.normalized_word));
    }
    if (item.status === "rejected"
      && item.owner_id
      && !personalWordKeys.has(getVocabularyTextPairKey(item.category_name, item.word))) {
      rejectedWordFallbacks.push({
        id: `retry-word-${item.id}`,
        word: item.word,
        meaning: item.meaning,
        category: item.category_name,
        ipa: item.ipa,
      });
    }
  }
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

  return { requestableWords, userWords };
}

export function getPublishVocabularyOptions(input: {
  categories: VocabularyCategoryRow[];
  words: VocabularyWord[];
  categoryRequests: CommunityCategoryRequest[];
  wordRequests: CommunityWordRequest[];
}) {
  const { categories, words, categoryRequests, wordRequests } = input;
  const defaultCategoryNames = new Set(defaultVocabularyCategories.map((item) => normalizeVocabularyText(item.name)));
  const defaultWordKeys = new Set(defaultVocabularyWords.map((item) => getVocabularyTextPairKey(item.category, item.word)));
  const categoryOptions = buildCategoryRequestOptions(categories, categoryRequests, defaultCategoryNames);
  const wordOptions = buildWordRequestOptions({
    words,
    requests: wordRequests,
    defaultCategoryNames,
    defaultWordKeys,
    ...categoryOptions,
  });

  return {
    defaultCategoryNames,
    communityCategoryNames: categoryOptions.communityCategoryNames,
    defaultWordKeys,
    requestableCategories: categoryOptions.requestableCategories,
    requestableWords: wordOptions.requestableWords,
    userWords: wordOptions.userWords,
  };
}
