import type { createClient } from "@/lib/supabase/client";

type SupabaseClient = ReturnType<typeof createClient>;

export async function findCommunityCategoryRequest(supabase: SupabaseClient, normalizedName: string) {
  return supabase.from("community_categories")
    .select("id, status").eq("normalized_name", normalizedName).maybeSingle();
}

export async function resubmitCommunityCategoryRequest(
  supabase: SupabaseClient,
  input: { id: string; ownerId: string; imagePath: string | null }
) {
  return supabase.from("community_categories")
    .update({ status: "pending", image_path: input.imagePath })
    .eq("id", input.id).eq("owner_id", input.ownerId).eq("status", "rejected")
    .select("id").maybeSingle();
}

export async function createCommunityCategoryRequest(
  supabase: SupabaseClient,
  input: { ownerId: string; name: string; color: string; imagePath: string | null }
) {
  return supabase.from("community_categories").insert({
    owner_id: input.ownerId,
    name: input.name,
    color: input.color,
    image_path: input.imagePath,
    status: "pending",
  });
}
