import type { SupabaseClient } from "@/lib/supabase/client";


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

export type CommunityCategoryRequestSaveResult =
  | { status: "error"; source: "lookup" | "resubmit" | "create"; message: string; code?: string }
  | { status: "existing"; requestStatus: string }
  | { status: "resubmit_unavailable" }
  | { status: "resubmitted" }
  | { status: "created" };

export async function saveCommunityCategoryRequest(
  supabase: SupabaseClient,
  input: {
    ownerId: string;
    name: string;
    normalizedName: string;
    color: string;
    imagePath: string | null;
  }
): Promise<CommunityCategoryRequestSaveResult> {
  const found = await findCommunityCategoryRequest(supabase, input.normalizedName);
  if (found.error) {
    return { status: "error", source: "lookup", message: found.error.message };
  }

  if (found.data) {
    if (found.data.status !== "rejected") {
      return { status: "existing", requestStatus: found.data.status };
    }

    const { data: updated, error } = await resubmitCommunityCategoryRequest(supabase, {
      id: found.data.id,
      ownerId: input.ownerId,
      imagePath: input.imagePath,
    });
    if (error) {
      return { status: "error", source: "resubmit", message: error.message };
    }
    return updated ? { status: "resubmitted" } : { status: "resubmit_unavailable" };
  }

  const { error } = await createCommunityCategoryRequest(supabase, {
    ownerId: input.ownerId,
    name: input.name,
    color: input.color,
    imagePath: input.imagePath,
  });
  if (error) {
    return {
      status: "error",
      source: "create",
      message: error.message,
      code: error.code,
    };
  }
  return { status: "created" };
}
