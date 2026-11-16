import type { VocabularyMeaning, VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCategory, VocabularyCategoryColor } from "@/config/vocabulary";
import type { VocabularyMeaningRow } from "@/types/database";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import type { VocabularyWordWithMeaningsRow } from "@/lib/supabase/vocabulary";
import { mapCommunityVocabularyCategories } from "@/lib/vocabulary/community-vocabulary-categories";
import { mapCommunityVocabularyWords } from "@/lib/vocabulary/community-vocabulary-words";

export type PublishedCommunityCategory = {
  id: string;
  owner_id: string;
  name: string;
  color: VocabularyCategoryColor;
  image_path: string | null;
  created_at: string;
  updated_at: string;
};

export type PublishedCommunityWord = {
  id: string;
  word: string;
  meaning: string;
  ipa: string | null;
  community_categories: {
    id: string;
    name: string;
    color: VocabularyCategoryColor;
    status: string;
  };
};

export { loadPublicSharedVocabulary, mapPublicCategories, mapPublicWords } from "@/lib/vocabulary/public-shared-vocabulary";
export type { PublicSharedVocabulary } from "@/lib/vocabulary/public-shared-vocabulary";

export function mapVocabularyMeaning(row: VocabularyMeaningRow): VocabularyMeaning {
  return {
    id: row.id,
    partOfSpeech: row.part_of_speech,
    meaning: row.meaning,
  };
}

export function mapVocabularyWordRow(row: VocabularyWordWithMeaningsRow): VocabularyWord {
  return {
    id: row.id,
    word: row.word,
    meaning: row.meaning,
    category: row.category as VocabularyCategory,
    status: row.status,
    type: row.type ?? "word",
    ipa: row.ipa ?? null,
    imagePath: row.image_path ?? null,
    detailedMeanings: (row.vocabulary_meanings ?? []).map(mapVocabularyMeaning),
  };
}

export function sortCategories(categories: VocabularyCategoryRow[]): VocabularyCategoryRow[] {
  return [...categories].sort((left, right) => {
    if (left.is_default !== right.is_default) return left.is_default ? -1 : 1;
    return left.name.localeCompare(right.name);
  });
}

export function mergeVocabularyCategories(
  personalCategories: VocabularyCategoryRow[],
  communityCategories: PublishedCommunityCategory[],
): VocabularyCategoryRow[] {
  const merged = mapCommunityVocabularyCategories(personalCategories, communityCategories, (category) => ({
    userId: category.owner_id,
    createdAt: category.created_at,
    updatedAt: category.updated_at,
  }));
  return sortCategories(merged);
}

export function mapCommunityWords(
  communityWords: PublishedCommunityWord[],
  personalWords: VocabularyWord[],
): VocabularyWord[] {
  return mapCommunityVocabularyWords(
    communityWords.map((item) => ({
      ...item,
      category: item.community_categories.name,
    })),
    personalWords,
  );
}
