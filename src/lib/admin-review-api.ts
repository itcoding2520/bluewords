import type { createClient } from "@/lib/supabase/client";
import { loadAdminUserEmails } from "@/lib/admin-users";
import type { AdminReviewSubmission, PublishedCategory, PublishedWord } from "@/lib/admin-review-types";

type SupabaseClient = ReturnType<typeof createClient>;
export type AdminReviewTable = "community_categories" | "community_words";
export type AdminReviewDecision = "published" | "rejected";

export async function loadAdminReviewSnapshot(supabase: SupabaseClient) {
  const [categoryResult, wordResult] = await Promise.all([
    supabase.from("community_categories").select("id, owner_id, name, color, image_path, status, created_at").eq("status", "pending").order("created_at"),
    supabase.from("community_words").select("id, owner_id, word, meaning, category_id, status, created_at, community_categories!inner(name, status, image_path, color)").eq("status", "pending").order("created_at"),
  ]);
  if (categoryResult.error || wordResult.error) throw categoryResult.error ?? wordResult.error;
  const pendingCategories = (categoryResult.data ?? []) as AdminReviewSubmission[];
  const pendingWords = ((wordResult.data ?? []) as unknown as Array<AdminReviewSubmission & {
    community_categories: { name: string; status: string; image_path: string | null; color: string };
  }>).map(({ community_categories, ...item }) => ({
    ...item,
    category_name: community_categories.name,
    category_status: community_categories.status,
    category_image_path: community_categories.image_path,
    category_color: community_categories.color,
  }));

  const [publishedCategoryResult, publishedWordResult] = await Promise.all([
    supabase.from("community_categories").select("id, owner_id, name, color, image_path, status").eq("status", "published").order("name"),
    supabase.from("community_words").select("id, owner_id, category_id, word, meaning, status, image_path").eq("status", "published").order("word"),
  ]);
  if (publishedCategoryResult.error || publishedWordResult.error) {
    throw publishedCategoryResult.error ?? publishedWordResult.error;
  }
  const publishedCategories = (publishedCategoryResult.data ?? []) as PublishedCategory[];
  const publishedWords = (publishedWordResult.data ?? []) as PublishedWord[];
  const ownerIds = [...pendingCategories, ...pendingWords, ...publishedCategories, ...publishedWords]
    .map((item) => item.owner_id);
  const ownerEmails = await loadAdminUserEmails(ownerIds, "Could not load submission authors.");

  return {
    categories: pendingCategories,
    words: pendingWords,
    publishedCategories,
    publishedWords,
    ownerEmails,
  };
}

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
