import type { SupabaseClient } from "@/lib/supabase/client";


export async function updateAdminSharedCategory(
  supabase: SupabaseClient,
  categoryId: string,
  name: string
) {
  const { error } = await supabase.from("community_categories")
    .update({ name }).eq("id", categoryId);
  return error;
}

export async function removeAdminSharedCategory(
  supabase: SupabaseClient,
  categoryId: string
) {
  const { error } = await supabase.from("community_categories")
    .delete().eq("id", categoryId);
  return error;
}

export async function updateAdminSharedWord(
  supabase: SupabaseClient,
  wordId: string,
  word: string,
  meaning: string
) {
  const { error } = await supabase.from("community_words")
    .update({ word, meaning }).eq("id", wordId);
  return error;
}

export async function removeAdminSharedWord(
  supabase: SupabaseClient,
  wordId: string
) {
  const { error } = await supabase.from("community_words")
    .delete().eq("id", wordId);
  return error;
}
