import type { createClient } from "@/lib/supabase/client";
import { getAdminCachedData } from "@/lib/admin-data-cache.mjs";
import { loadAdminUserEmails } from "@/lib/admin-users";

type SupabaseClient = ReturnType<typeof createClient>;

export type CategoryTab = "default" | "published" | "pending";

export interface CommunityCategory {
  id: string;
  owner_id: string;
  name: string;
  color: string;
  status: "pending" | "published";
  created_at: string;
  image_path: string | null;
}

export interface CommunityWord {
  id: string;
  owner_id: string;
  category_id: string;
  word: string;
  meaning: string;
  status: string;
  created_at: string;
  image_path: string | null;
}

export function loadAdminCategories(supabase: SupabaseClient, force = false) {
  return getAdminCachedData("admin:categories:list", async () => {
    const { data, error } = await supabase.from("community_categories")
      .select("id, owner_id, name, color, status, created_at, image_path")
      .in("status", ["published", "pending"]).order("name");
    if (error) throw error;

    const categories = (data ?? []) as CommunityCategory[];
    const emails = await loadAdminUserEmails(
      categories.map((category) => category.owner_id),
      "Could not load category owners."
    );
    return { categories, emails };
  }, { force });
}

export function loadAdminCategoryWords(
  supabase: SupabaseClient,
  category: Pick<CommunityCategory, "id">,
  status: "pending" | "published"
) {
  return getAdminCachedData(
    `admin:categories:words:${category.id}:${status}`,
    async () => {
      const { data, error } = await supabase.from("community_words")
        .select("id, owner_id, category_id, word, meaning, status, created_at, image_path")
        .eq("category_id", category.id)
        .eq("status", status)
        .order("word");
      if (error) throw error;

      const words = (data ?? []) as CommunityWord[];
      const emails = await loadAdminUserEmails(
        words.map((word) => word.owner_id),
        "Could not load word authors."
      );
      return { words, emails };
    }
  );
}
