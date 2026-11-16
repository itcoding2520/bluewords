import { getVocabularyCategoriesForUser } from "@/lib/supabase/categories";
import { getVocabularyWords } from "@/lib/supabase/vocabulary";
import { firstRelation } from "@/lib/supabase/first-relation";
import type { VocabularyCategoryColor } from "@/config/vocabulary";
import type { SupabaseClient } from "@/lib/supabase/client";
import type {
  AuthenticatedVocabularyCategoriesSnapshot,
  AuthenticatedVocabularySnapshot,
} from "@/lib/supabase/vocabulary-store-mapping";

function getPublishedCommunityCategoriesQuery(supabase: SupabaseClient) {
  return supabase.from("community_categories")
    .select("id, owner_id, name, color, image_path, status, created_at, updated_at")
    .eq("status", "published");
}

export async function loadAuthenticatedVocabularyCategories(
  supabase: SupabaseClient,
  userId: string
): Promise<AuthenticatedVocabularyCategoriesSnapshot> {
  const [personalCategories, communityResult] = await Promise.all([
    getVocabularyCategoriesForUser(userId),
    getPublishedCommunityCategoriesQuery(supabase),
  ]);

  return {
    personalCategories,
    communityCategories: (communityResult.data ?? []) as AuthenticatedVocabularyCategoriesSnapshot["communityCategories"],
    error: communityResult.error,
  };
}

export async function loadAuthenticatedVocabularySnapshot(
  supabase: SupabaseClient,
  userId: string
): Promise<AuthenticatedVocabularySnapshot> {
  const [wordRows, personalCategories, communityCategoryResult, communityWordResult] = await Promise.all([
    getVocabularyWords(),
    getVocabularyCategoriesForUser(userId),
    getPublishedCommunityCategoriesQuery(supabase),
    supabase.from("community_words")
      .select("id, word, meaning, ipa, community_categories!inner(id, name, color, status)")
      .eq("status", "published")
      .eq("community_categories.status", "published"),
  ]);

  const communityCategories = (communityCategoryResult.data ?? []) as AuthenticatedVocabularySnapshot["communityCategories"];
  const communityWords = (communityWordResult.data ?? []).flatMap(({ community_categories, ...word }) => {
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

  return {
    wordRows,
    personalCategories,
    communityCategories,
    communityWords,
    communityCategoriesError: communityCategoryResult.error,
    communityWordsError: communityWordResult.error,
  };
}
