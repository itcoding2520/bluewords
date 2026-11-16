import type { SupabaseClient } from "@/lib/supabase/client";
import {
  createCommunityCategoryForWordRequest,
  createCommunityWordRequest,
  findCommunityCategory,
  findOwnCommunityWordRequest,
  resubmitCommunityWordRequest,
} from "@/lib/supabase/publish-word-request";
import {
  saveOrResubmitPublishRequest,
  type PublishRequestSaveResult,
} from "@/lib/vocabulary/publish-request-save-workflow";

export type CommunityCategoryResolution =
  | { status: "ready"; category: { id: string; owner_id: string; status: string } }
  | { status: "error"; source: "lookup" | "create"; message: string; code?: string }
  | { status: "default_category_unavailable" }
  | { status: "not_found" };

export async function resolveCommunityCategoryForWordRequest(
  supabase: SupabaseClient,
  input: {
    ownerId: string;
    name: string;
    normalizedName: string;
    defaultCategoryUnavailable: boolean;
    color: string;
    imagePath: string | null;
  }
): Promise<CommunityCategoryResolution> {
  const lookup = await findCommunityCategory(supabase, input.normalizedName);
  if (lookup.error) {
    return { status: "error", source: "lookup", message: lookup.error.message };
  }

  let category = lookup.data;
  if (!category) {
    if (input.defaultCategoryUnavailable) {
      return { status: "default_category_unavailable" };
    }
    const created = await createCommunityCategoryForWordRequest(supabase, {
      ownerId: input.ownerId,
      name: input.name,
      color: input.color,
      imagePath: input.imagePath,
    });
    if (created.error) {
      return {
        status: "error",
        source: "create",
        message: created.error.message,
        code: created.error.code,
      };
    }
    category = created.data;
  }

  return category ? { status: "ready", category } : { status: "not_found" };
}

export type CommunityWordRequestSaveResult = PublishRequestSaveResult;

export async function saveCommunityWordRequest(
  supabase: SupabaseClient,
  input: {
    ownerId: string;
    categoryId: string;
    normalizedWord: string;
    vocabularyWordId: string;
    word: string;
    meaning: string;
    ipa: string | null;
  }
): Promise<CommunityWordRequestSaveResult> {
  return saveOrResubmitPublishRequest({
    findExisting: () => findOwnCommunityWordRequest(supabase, {
      ownerId: input.ownerId,
      categoryId: input.categoryId,
      normalizedWord: input.normalizedWord,
    }),
    resubmit: (request) => resubmitCommunityWordRequest(supabase, {
      id: request.id,
      ownerId: input.ownerId,
      word: input.word,
      meaning: input.meaning,
      ipa: input.ipa,
    }),
    create: () => createCommunityWordRequest(supabase, {
      ownerId: input.ownerId,
      categoryId: input.categoryId,
      vocabularyWordId: input.vocabularyWordId,
      word: input.word,
      meaning: input.meaning,
      ipa: input.ipa,
    }),
  });
}
