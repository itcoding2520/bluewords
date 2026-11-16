import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import type { VocabularyWordWithMeaningsRow } from "@/lib/supabase/vocabulary";
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
