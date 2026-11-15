import type { SupabaseClient } from "@/lib/supabase/client";
import {
  createCommunityCategoryForWordRequest,
  createCommunityWordRequest,
  findCommunityCategory,
  findOwnCommunityWordRequest,
  resubmitCommunityWordRequest,
} from "@/lib/supabase/publish-word-request";

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

export type CommunityWordRequestSaveResult =
  | { status: "error"; source: "lookup" | "resubmit" | "create"; message: string; code?: string }
  | { status: "existing"; requestStatus: string }
  | { status: "resubmit_unavailable" }
  | { status: "resubmitted" }
  | { status: "created" };

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
  const previous = await findOwnCommunityWordRequest(supabase, {
    ownerId: input.ownerId,
    categoryId: input.categoryId,
    normalizedWord: input.normalizedWord,
  });
  if (previous.error) {
    return { status: "error", source: "lookup", message: previous.error.message };
  }

  if (previous.data) {
    if (previous.data.status !== "rejected") {
      return { status: "existing", requestStatus: previous.data.status };
    }

    const { data: updated, error } = await resubmitCommunityWordRequest(supabase, {
      id: previous.data.id,
      ownerId: input.ownerId,
      word: input.word,
      meaning: input.meaning,
      ipa: input.ipa,
    });
    if (error) {
      return { status: "error", source: "resubmit", message: error.message };
    }
    return updated ? { status: "resubmitted" } : { status: "resubmit_unavailable" };
  }

  const { error } = await createCommunityWordRequest(supabase, {
    ownerId: input.ownerId,
    categoryId: input.categoryId,
    vocabularyWordId: input.vocabularyWordId,
    word: input.word,
    meaning: input.meaning,
    ipa: input.ipa,
  });
  if (error) {
    return { status: "error", source: "create", message: error.message, code: error.code };
  }
  return { status: "created" };
}
