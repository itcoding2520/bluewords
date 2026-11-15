import type { SupabaseClient } from "@/lib/supabase/client";
import type {
  CommunityCategoryRequest,
  CommunityWordRequest,
} from "@/lib/supabase/publish-vocabulary-request-types";

export async function loadPublishVocabularyRequests(supabase: SupabaseClient) {
  const [categoryResult, wordResult] = await Promise.all([
    supabase.from("community_categories").select("id, owner_id, name, status"),
    supabase.from("community_words")
      .select("id, owner_id, category_id, normalized_word, word, meaning, ipa, status, community_categories!inner(name)")
      .in("status", ["pending", "published", "rejected"]),
  ]);
  if (categoryResult.error || wordResult.error) {
    throw new Error(categoryResult.error?.message ?? wordResult.error?.message ?? "Could not load request status.");
  }

  return {
    categories: (categoryResult.data ?? []) as CommunityCategoryRequest[],
    words: ((wordResult.data ?? []) as unknown as Array<CommunityWordRequest & {
      community_categories: { name: string };
    }>).map(({ community_categories, ...item }) => ({
      ...item,
      category_name: community_categories.name,
    })),
  };
}
