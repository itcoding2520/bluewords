import type { createClient } from "@/lib/supabase/client";

type SupabaseClient = ReturnType<typeof createClient>;

export function findOwnedVocabularyWord(supabase: SupabaseClient, wordId: string, userId: string) {
  return supabase.from("vocabulary_words")
    .select("id").eq("id", wordId).eq("user_id", userId).maybeSingle();
}

export function findCommunityCategory(supabase: SupabaseClient, normalizedName: string) {
  return supabase.from("community_categories")
    .select("id, owner_id, status").eq("normalized_name", normalizedName).maybeSingle();
}

export function createCommunityCategoryForWordRequest(
  supabase: SupabaseClient,
  input: { ownerId: string; name: string; color: string; imagePath: string | null }
) {
  return supabase.from("community_categories").insert({
    owner_id: input.ownerId,
    name: input.name,
    color: input.color,
    image_path: input.imagePath,
    status: "pending",
  }).select("id, owner_id, status").single();
}

export function findPublishedCommunityWord(
  supabase: SupabaseClient,
  categoryId: string,
  normalizedWord: string
) {
  return supabase.from("community_words").select("id")
    .eq("category_id", categoryId).eq("normalized_word", normalizedWord)
    .eq("status", "published").maybeSingle();
}

export function findOwnCommunityWordRequest(
  supabase: SupabaseClient,
  input: { ownerId: string; categoryId: string; normalizedWord: string }
) {
  return supabase.from("community_words").select("id, status")
    .eq("owner_id", input.ownerId).eq("category_id", input.categoryId)
    .eq("normalized_word", input.normalizedWord).maybeSingle();
}

export function resubmitCommunityWordRequest(
  supabase: SupabaseClient,
  input: { id: string; ownerId: string; word: string; meaning: string; ipa: string | null }
) {
  return supabase.from("community_words")
    .update({ word: input.word, meaning: input.meaning, ipa: input.ipa, status: "pending" })
    .eq("id", input.id).eq("owner_id", input.ownerId).eq("status", "rejected")
    .select("id").maybeSingle();
}

export function createCommunityWordRequest(
  supabase: SupabaseClient,
  input: {
    ownerId: string;
    categoryId: string;
    vocabularyWordId: string;
    word: string;
    meaning: string;
    ipa: string | null;
  }
) {
  return supabase.from("community_words").insert({
    owner_id: input.ownerId,
    category_id: input.categoryId,
    source_vocabulary_word_id: input.vocabularyWordId,
    word: input.word,
    meaning: input.meaning,
    ipa: input.ipa,
    image_path: null,
    status: "pending",
  });
}
