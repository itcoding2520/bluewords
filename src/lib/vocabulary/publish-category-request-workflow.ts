import type { SupabaseClient } from "@/lib/supabase/client";
import {
  createCommunityCategoryRequest,
  findCommunityCategoryRequest,
  resubmitCommunityCategoryRequest,
} from "@/lib/supabase/publish-category-request";
import {
  saveOrResubmitPublishRequest,
  type PublishRequestSaveResult,
} from "@/lib/vocabulary/publish-request-save-workflow";

export type CommunityCategoryRequestSaveResult = PublishRequestSaveResult;

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
  return saveOrResubmitPublishRequest({
    findExisting: () => findCommunityCategoryRequest(supabase, input.normalizedName),
    resubmit: (request) => resubmitCommunityCategoryRequest(supabase, {
      id: request.id,
      ownerId: input.ownerId,
      imagePath: input.imagePath,
    }),
    create: () => createCommunityCategoryRequest(supabase, {
      ownerId: input.ownerId,
      name: input.name,
      color: input.color,
      imagePath: input.imagePath,
    }),
  });
}
