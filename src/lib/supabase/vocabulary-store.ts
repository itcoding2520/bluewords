import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { getVocabularyCategoriesForUser } from "@/lib/supabase/categories";
import { getVocabularyWords, type VocabularyWordWithMeaningsRow } from "@/lib/supabase/vocabulary";
import type { createClient } from "@/lib/supabase/client";
import {
  mapCommunityWords,
  mapVocabularyWordRow,
  mergeVocabularyCategories,
  type PublishedCommunityCategory,
  type PublishedCommunityWord,
} from "@/lib/vocabulary/shared-vocabulary";

type SupabaseClient = ReturnType<typeof createClient>;

export async function loadAuthenticatedVocabularyCategories(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  personalCategories: VocabularyCategoryRow[];
  communityCategories: PublishedCommunityCategory[];
  error: Error | null;
}> {
  const [personalCategories, communityResult] = await Promise.all([
    getVocabularyCategoriesForUser(userId),
    supabase.from("community_categories")
      .select("id, owner_id, name, color, image_path, status, created_at, updated_at")
      .eq("status", "published"),
  ]);

  return {
    personalCategories,
    communityCategories: (communityResult.data ?? []) as PublishedCommunityCategory[],
    error: communityResult.error,
  };
}

export async function loadAuthenticatedVocabularySnapshot(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  wordRows: VocabularyWordWithMeaningsRow[];
  personalCategories: VocabularyCategoryRow[];
  communityCategories: PublishedCommunityCategory[];
  communityWords: PublishedCommunityWord[];
  communityCategoriesError: Error | null;
  communityWordsError: Error | null;
}> {
  const [wordRows, personalCategories, communityCategoryResult, communityWordResult] = await Promise.all([
    getVocabularyWords(),
    getVocabularyCategoriesForUser(userId),
    supabase.from("community_categories")
      .select("id, owner_id, name, color, image_path, status, created_at, updated_at")
      .eq("status", "published"),
    supabase.from("community_words")
      .select("id, word, meaning, ipa, community_categories!inner(id, name, color, status)")
      .eq("status", "published")
      .eq("community_categories.status", "published"),
  ]);

  const communityCategories = (communityCategoryResult.data ?? []) as PublishedCommunityCategory[];
  const communityWords = (communityWordResult.data ?? []) as unknown as PublishedCommunityWord[];

  return {
    wordRows,
    personalCategories,
    communityCategories,
    communityWords,
    communityCategoriesError: communityCategoryResult.error,
    communityWordsError: communityWordResult.error,
  };
}

export function mapAuthenticatedVocabularySnapshot(snapshot: Awaited<ReturnType<typeof loadAuthenticatedVocabularySnapshot>>) {
  const personalWords = snapshot.wordRows.map(mapVocabularyWordRow);
  return {
    words: [...personalWords, ...mapCommunityWords(snapshot.communityWords, personalWords)],
    categories: mergeVocabularyCategories(snapshot.personalCategories, snapshot.communityCategories),
  };
}

export function mapAuthenticatedVocabularyCategories(snapshot: Awaited<ReturnType<typeof loadAuthenticatedVocabularyCategories>>) {
  return mergeVocabularyCategories(snapshot.personalCategories, snapshot.communityCategories);
}
