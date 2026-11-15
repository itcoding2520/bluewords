import type { SupabaseClient } from "@/lib/supabase/client";
import {
  createCommunityCategoryRequest,
  findCommunityCategoryRequest,
  resubmitCommunityCategoryRequest,
} from "@/lib/supabase/publish-category-request";

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
