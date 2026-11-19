import type { VocabularyCategoryColor } from "@/config/vocabulary";
import type { SupabaseClient } from "@/lib/supabase/client";
import { loadAdminUserEmails } from "@/lib/admin-users";
import { isAdminUser } from "@/lib/supabase/admin-access";
import { getCurrentSessionUserOrNull } from "@/lib/supabase/authenticated-user";
import { normalizeVocabularyLabel } from "@/lib/vocabulary/normalize-text";


export async function checkCurrentUserIsAdmin(supabase: SupabaseClient): Promise<boolean> {
  const user = await getCurrentSessionUserOrNull(supabase);
  if (!user) return false;
  return isAdminUser(supabase, user.id);
}

export async function loadPublishedCategoryAuthors(supabase: SupabaseClient) {
  const { data } = await supabase.from("community_categories")
    .select("name, owner_id").eq("status", "published");
  const categories = (data ?? []) as Array<{ name: string; owner_id: string }>;
  const ownerIds = [...new Set(categories.map((item) => item.owner_id))];
  const emails = await loadAdminUserEmails(ownerIds, "Could not load category authors.")
    .catch((): Record<string, string> => ({}));

  return Object.fromEntries(categories.map((item) => [
    normalizeVocabularyLabel(item.name),
    emails[item.owner_id] ?? "Loading author…",
  ]));
}

export async function updateSharedCategoryImage(
  supabase: SupabaseClient,
  categoryId: string,
  imagePath: string
) {
  const { error } = await supabase.from("community_categories")
    .update({ image_path: imagePath }).eq("id", categoryId);
  return error;
}

export async function updatePublishedCategoryImageByName(
  supabase: SupabaseClient,
  name: string,
  imagePath: string
) {
  const normalizedName = name.trim().replace(/\s+/g, " ").toLocaleLowerCase();
  const { error } = await supabase.from("community_categories")
    .update({ image_path: imagePath })
    .eq("normalized_name", normalizedName)
    .eq("status", "published");
  return error;
}

export async function updateSharedCategoryDetails(
  supabase: SupabaseClient,
  categoryId: string,
  updates: { name: string; color: VocabularyCategoryColor }
) {
  const { error } = await supabase.from("community_categories")
    .update(updates).eq("id", categoryId);
  return error;
}
