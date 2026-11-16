import type { VocabularyCategoryColor } from "@/config/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import type { VocabularyWordWithMeaningsRow } from "@/lib/supabase/vocabulary";
import { firstRelation } from "@/lib/supabase/first-relation";
import {
  mapCommunityWords,
  mapVocabularyWordRow,
  mergeVocabularyCategories,
  type PublishedCommunityCategory,
  type PublishedCommunityWord,
} from "@/lib/vocabulary/shared-vocabulary";

export interface AuthenticatedVocabularyCategoriesSnapshot {
  personalCategories: VocabularyCategoryRow[];
  communityCategories: PublishedCommunityCategory[];
  error: Error | null;
}

export interface AuthenticatedVocabularySnapshot {
  wordRows: VocabularyWordWithMeaningsRow[];
  personalCategories: VocabularyCategoryRow[];
  communityCategories: PublishedCommunityCategory[];
  communityWords: PublishedCommunityWord[];
  communityCategoriesError: Error | null;
  communityWordsError: Error | null;
}

type PublishedCommunityWordRow = Pick<PublishedCommunityWord, "id" | "word" | "meaning" | "ipa"> & {
  community_categories:
    | (Omit<PublishedCommunityWord["community_categories"], "color"> & { color: string })
    | Array<Omit<PublishedCommunityWord["community_categories"], "color"> & { color: string }>
    | null;
};

export function mapPublishedCommunityWordRows(
  rows: PublishedCommunityWordRow[],
): PublishedCommunityWord[] {
  return rows.flatMap(({ community_categories, ...word }) => {
    const category = firstRelation(community_categories);
    return category ? [{
      ...word,
      community_categories: {
        id: category.id,
        name: category.name,
        color: category.color as VocabularyCategoryColor,
        status: category.status,
      },
    }] : [];
  });
}

export function mapAuthenticatedVocabularySnapshot(snapshot: AuthenticatedVocabularySnapshot) {
  const personalWords = snapshot.wordRows.map(mapVocabularyWordRow);
  return {
    words: [...personalWords, ...mapCommunityWords(snapshot.communityWords, personalWords)],
    categories: mergeVocabularyCategories(snapshot.personalCategories, snapshot.communityCategories),
  };
}

export function mapAuthenticatedVocabularyCategories(snapshot: AuthenticatedVocabularyCategoriesSnapshot) {
  return mergeVocabularyCategories(snapshot.personalCategories, snapshot.communityCategories);
}
