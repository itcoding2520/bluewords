import type { SupabaseClient } from "@/lib/supabase/client";
import { firstRelation } from "@/lib/supabase/first-relation";

export interface CommunityWord {
  id: string;
  word: string;
  meaning: string;
  ipa: string | null;
  image_path: string | null;
  community_categories: { name: string; image_path: string | null; color: string };
}

export async function loadPublishedCommunityVocabulary(supabase: SupabaseClient) {
  const { data } = await supabase.from("community_words")
    .select("id, word, meaning, ipa, image_path, community_categories!inner(name, status, image_path, color)")
    .eq("status", "published")
    .eq("community_categories.status", "published")
    .order("word");

  return (data ?? []).flatMap(({ community_categories, ...word }) => {
    const category = firstRelation(community_categories);
    return category ? [{ ...word, community_categories: category }] : [];
  });
}
