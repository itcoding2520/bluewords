import type { SupabaseClient } from "@/lib/supabase/client";
import { firstRelation } from "@/lib/supabase/first-relation";
import { loadAdminUserEmails } from "@/lib/admin-users";
import type {
  AdminReviewDecision,
  AdminReviewSubmission,
  AdminReviewTable,
  PublishedCategory,
  PublishedWord,
} from "@/lib/admin-review-types";

export type { AdminReviewDecision, AdminReviewTable } from "@/lib/admin-review-types";

export async function loadAdminReviewSnapshot(supabase: SupabaseClient) {
  const [categoryResult, wordResult] = await Promise.all([
    supabase.from("community_categories").select("id, owner_id, name, color, image_path, status, created_at").eq("status", "pending").order("created_at"),
    supabase.from("community_words").select("id, owner_id, word, meaning, category_id, status, created_at, community_categories!inner(name, status, image_path, color)").eq("status", "pending").order("created_at"),
  ]);
  if (categoryResult.error || wordResult.error) throw categoryResult.error ?? wordResult.error;
  const pendingCategories = (categoryResult.data ?? []) as AdminReviewSubmission[];
  const pendingWords = (wordResult.data ?? []).flatMap(({ community_categories, ...item }) => {
    const category = firstRelation(community_categories);
    return category ? [{
      ...item,
      category_name: category.name,
      category_status: category.status,
      category_image_path: category.image_path,
      category_color: category.color,
    }] : [];
  });

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
