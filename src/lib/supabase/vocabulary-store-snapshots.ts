import { defaultVocabularyWords } from "@/data/default-vocabulary";
import type { SupabaseClient } from "@/lib/supabase/client";
import { loadAuthenticatedVocabularySnapshot } from "@/lib/supabase/vocabulary-store";
import { mapAuthenticatedVocabularySnapshot } from "@/lib/supabase/vocabulary-store-mapping";
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
