import type { createClient } from "@/lib/supabase/client";

type SupabaseClient = ReturnType<typeof createClient>;
export type AdminReviewTable = "community_categories" | "community_words";
export type AdminReviewDecision = "published" | "rejected";

export async function updateAdminReviewStatus(
  supabase: SupabaseClient,
  table: AdminReviewTable,
  id: string,
  status: AdminReviewDecision
) {
  const { error } = await supabase.from(table).update({ status }).eq("id", id);
  return error;
}

export async function createPublishedCategory(supabase: SupabaseClient, name: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { authenticated: false as const, error: null };

  const { error } = await supabase.from("community_categories").insert({
    owner_id: user.id,
    name,
    color: "blue",
    status: "published",
  });
  return { authenticated: true as const, error };
}

export async function createPublishedWord(
  supabase: SupabaseClient,
  input: { categoryId: string; word: string; meaning: string }
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { authenticated: false as const, error: null };

  const { error } = await supabase.from("community_words").insert({
    owner_id: user.id,
    category_id: input.categoryId,
    word: input.word,
    meaning: input.meaning,
    status: "published",
  });
  return { authenticated: true as const, error };
}

export async function removePublishedAdminReview(
  supabase: SupabaseClient,
  table: AdminReviewTable,
  id: string
) {
  const { error } = await supabase.from(table).update({ status: "removed" }).eq("id", id);
  return error;
}

export async function editPublishedWord(
  supabase: SupabaseClient,
  id: string,
  word: string,
  meaning: string
) {
  const { error } = await supabase.from("community_words")
    .update({ word, meaning }).eq("id", id);
  return error;
}

export async function editPublishedCategory(
  supabase: SupabaseClient,
  id: string,
  name: string
) {
  const { error } = await supabase.from("community_categories")
    .update({ name }).eq("id", id);
  return error;
}
