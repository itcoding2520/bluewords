import type { SupabaseClient } from "@/lib/supabase/client";


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

export type CommunityCategoryResolution =
  | {
      status: "ready";
      category: { id: string; owner_id: string; status: string };
    }
  | {
      status: "error";
      source: "lookup" | "create";
      message: string;
      code?: string;
    }
  | { status: "default_category_unavailable" }
  | { status: "not_found" };

export async function resolveCommunityCategoryForWordRequest(
  supabase: SupabaseClient,
  input: {
    ownerId: string;
    name: string;
    normalizedName: string;
    defaultCategoryUnavailable: boolean;
    color: string;
    imagePath: string | null;
  }
): Promise<CommunityCategoryResolution> {
  const lookup = await findCommunityCategory(supabase, input.normalizedName);
  if (lookup.error) {
    return { status: "error", source: "lookup", message: lookup.error.message };
  }

  let category = lookup.data;
  if (!category) {
    if (input.defaultCategoryUnavailable) {
      return { status: "default_category_unavailable" };
    }
    const created = await createCommunityCategoryForWordRequest(supabase, {
      ownerId: input.ownerId,
      name: input.name,
      color: input.color,
      imagePath: input.imagePath,
    });
    if (created.error) {
      return {
        status: "error",
        source: "create",
        message: created.error.message,
        code: created.error.code,
      };
    }
    category = created.data;
  }

  return category
    ? { status: "ready", category }
    : { status: "not_found" };
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
