import type { SupabaseClient } from "@/lib/supabase/client";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { findPublishedCommunityWord } from "@/lib/supabase/publish-word-request";
import {
  resolveCommunityCategoryForWordRequest,
  saveCommunityWordRequest,
  type CommunityWordRequestSaveResult,
} from "@/lib/vocabulary/publish-word-request-workflows";
import { normalizeVocabularyText } from "@/lib/vocabulary/normalize-text";

export interface PublishableWord {
  id: string;
  word: string;
  meaning: string;
  category: string;
  ipa?: string | null;
}

export type PublishWordSubmissionResult =
  | { status: "default_word" }
  | { status: "category_resolution_error"; source: "lookup" | "create"; message: string; code?: string }
  | { status: "default_category_unavailable" }
  | { status: "category_not_found" }
  | { status: "category_not_available" }
  | { status: "published_word_lookup_error"; message: string }
  | { status: "already_published" }
  | { status: "saved"; result: CommunityWordRequestSaveResult };

export async function submitCommunityWordRequest(
  supabase: SupabaseClient,
  input: {
    ownerId: string;
    word: PublishableWord;
    defaultWordKeys: Set<string>;
    defaultCategoryNames: Set<string>;
    categories: VocabularyCategoryRow[];
  }
): Promise<PublishWordSubmissionResult> {
  const normalizedCategory = normalizeVocabularyText(input.word.category);
  const normalizedWord = normalizeVocabularyText(input.word.word);
  if (input.defaultWordKeys.has(`${normalizedCategory}\u0000${normalizedWord}`)) {
    return { status: "default_word" };
  }

  const category = input.categories.find((item) => item.name === input.word.category);
  const categoryResolution = await resolveCommunityCategoryForWordRequest(supabase, {
    ownerId: input.ownerId,
    name: input.word.category,
    normalizedName: normalizedCategory,
    defaultCategoryUnavailable: input.defaultCategoryNames.has(normalizedCategory),
    color: category?.color ?? "blue",
    imagePath: category?.image_path ?? null,
  });
  if (categoryResolution.status === "error") {
    return {
      status: "category_resolution_error",
      source: categoryResolution.source,
      message: categoryResolution.message,
      code: categoryResolution.code,
    };
  }
  if (categoryResolution.status === "default_category_unavailable") {
    return { status: "default_category_unavailable" };
  }
  if (categoryResolution.status === "not_found") {
    return { status: "category_not_found" };
  }

  const communityCategory = categoryResolution.category;
  if (communityCategory.status !== "published"
    && !(communityCategory.status === "pending" && communityCategory.owner_id === input.ownerId)) {
    return { status: "category_not_available" };
  }

  const alreadyPublished = await findPublishedCommunityWord(supabase, communityCategory.id, normalizedWord);
  if (alreadyPublished.error) {
    return { status: "published_word_lookup_error", message: alreadyPublished.error.message };
  }
  if (alreadyPublished.data) return { status: "already_published" };

  const result = await saveCommunityWordRequest(supabase, {
    ownerId: input.ownerId,
    categoryId: communityCategory.id,
    normalizedWord,
    vocabularyWordId: input.word.id,
    word: input.word.word,
    meaning: input.word.meaning,
    ipa: input.word.ipa ?? null,
  });
  return { status: "saved", result };
}
