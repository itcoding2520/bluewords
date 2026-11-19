import { defaultVocabularyWords } from "@/data/default-vocabulary";
import type { SupabaseClient } from "@/lib/supabase/client";
import {
  loadAuthenticatedVocabularySnapshot,
  loadPublishedCommunityVocabularyCategories,
} from "@/lib/supabase/vocabulary-store";
import {
  mapAuthenticatedVocabularySnapshot,
  mapPublishedCommunityWordRows,
} from "@/lib/supabase/vocabulary-store-mapping";
import { getVocabularyWords } from "@/lib/supabase/vocabulary";
import { getVocabularyCategoriesForUser } from "@/lib/supabase/categories";
import { mapVocabularyWordRow, mergeVocabularyCategories } from "@/lib/vocabulary/shared-vocabulary";
import {
  loadPublicSharedVocabulary,
  mapPublicCategories,
  mapPublicWords,
} from "@/lib/vocabulary/public-shared-vocabulary";

export async function loadGuestVocabularySnapshot() {
  const shared = await loadPublicSharedVocabulary();
  return {
    words: [...defaultVocabularyWords, ...mapPublicWords(shared)],
    categories: mapPublicCategories(shared),
  };
}

export async function loadAuthenticatedVocabularyView(
  supabase: SupabaseClient,
  userId: string
) {
  const snapshot = await loadAuthenticatedVocabularySnapshot(supabase, userId);
  return {
    ...mapAuthenticatedVocabularySnapshot(snapshot),
    communityCategoriesError: snapshot.communityCategoriesError,
    communityWordsError: snapshot.communityWordsError,
  };
}

export async function loadAuthenticatedVocabularyCoreView(
  userId: string,
) {
  const [wordRows, personalCategories] = await Promise.all([
    getVocabularyWords(),
    getVocabularyCategoriesForUser(userId),
  ]);

  return {
    words: wordRows.map(mapVocabularyWordRow),
    categories: mergeVocabularyCategories(personalCategories, []),
  };
}

export async function loadAuthenticatedCommunityVocabularyView(
  supabase: SupabaseClient,
) {
  const categoriesPromise = loadPublishedCommunityVocabularyCategories(supabase);
  const wordsPromise = supabase.from("community_words")
    .select("id, word, meaning, ipa, community_categories!inner(id, name, color, status)")
    .eq("status", "published")
    .eq("community_categories.status", "published");
  const [categories, words] = await Promise.all([categoriesPromise, wordsPromise]);

  return {
    categories: categories.categories,
    categoryError: categories.error,
    words: mapPublishedCommunityWordRows(words.data ?? []),
    wordsError: words.error,
  };
}
