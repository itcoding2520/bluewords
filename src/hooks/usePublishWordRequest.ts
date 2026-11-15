import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { normalize, type CommunityWordRequest } from "@/lib/vocabulary/publish-options";
import {
  findPublishedCommunityWord,
  verifyPublishWordRequestOwnership,
} from "@/lib/supabase/publish-word-request";
import {
  resolveCommunityCategoryForWordRequest,
  saveCommunityWordRequest,
} from "@/lib/vocabulary/publish-word-request-workflows";

interface PublishableWord {
  id: string;
  word: string;
  meaning: string;
  category: string;
  ipa?: string | null;
}

interface UsePublishWordRequestOptions {
  userWords: PublishableWord[];
  requestableWords: PublishableWord[];
  communityWordRequests: CommunityWordRequest[];
  defaultWordKeys: Set<string>;
  defaultCategoryNames: Set<string>;
  categories: VocabularyCategoryRow[];
  setStatus: Dispatch<SetStateAction<string>>;
}

const REQUEST_SENT_MESSAGE = "Your selected vocabulary has been sent to the admin for review.";

export function usePublishWordRequest({
  userWords,
  requestableWords,
  communityWordRequests,
  defaultWordKeys,
  defaultCategoryNames,
  categories,
  setStatus,
}: UsePublishWordRequestOptions) {
  const supabase = useSupabaseClient();

  async function publishWord(wordId: string) {
    if (!userWords.some((item) => item.id === wordId)) {
      toast.error("You can only request words from your own vocabulary.");
      return;
    }
    const word = requestableWords.find((item) => item.id === wordId);
    if (!word) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ownership = await verifyPublishWordRequestOwnership(supabase, {
      wordId,
      ownerId: user.id,
      requests: communityWordRequests,
    });
    if (ownership.status === "error") {
      toast.error(ownership.message);
      return;
    }
    if (ownership.status === "forbidden") {
      toast.error(wordId.startsWith("retry-word-")
        ? "You can only resubmit a rejected word request that you created."
        : "You can only request words from your own vocabulary.");
      return;
    }
    const normalizedCategory = normalize(word.category);
    const normalizedWord = normalize(word.word);
    if (defaultWordKeys.has(`${normalizedCategory}\u0000${normalizedWord}`)) {
      toast.info(`“${word.word}” is already part of the default vocabulary in ${word.category}.`);
      return;
    }
    const category = categories.find((item) => item.name === word.category);
    const categoryResolution = await resolveCommunityCategoryForWordRequest(supabase, {
      ownerId: user.id,
      name: word.category,
      normalizedName: normalizedCategory,
      defaultCategoryUnavailable: defaultCategoryNames.has(normalizedCategory),
      color: category?.color ?? "blue",
      imagePath: category?.image_path ?? null,
    });
    if (categoryResolution.status === "error") {
      toast.error(categoryResolution.source === "create" && categoryResolution.code === "23505"
        ? "This category already has a review request."
        : categoryResolution.message);
      return;
    }
    if (categoryResolution.status === "default_category_unavailable") {
      toast.error("This shared category is not available for word requests yet. Refresh the page and try again.");
      return;
    }
    if (categoryResolution.status === "not_found") {
      toast.error("Could not locate the category.");
      return;
    }
    const communityCategory = categoryResolution.category;
    if (communityCategory.status !== "published"
      && !(communityCategory.status === "pending" && communityCategory.owner_id === user.id)) {
      toast.error("Words can only be requested in your own or an approved category.");
      return;
    }
    const alreadyPublished = await findPublishedCommunityWord(supabase, communityCategory.id, normalizedWord);
    if (alreadyPublished.error) { toast.error(alreadyPublished.error.message); return; }
    if (alreadyPublished.data) {
      toast.info(`“${word.word}” is already published in ${word.category}.`);
      return;
    }
    const result = await saveCommunityWordRequest(supabase, {
      ownerId: user.id,
      categoryId: communityCategory.id,
      normalizedWord,
      vocabularyWordId: word.id,
      word: word.word,
      meaning: word.meaning,
      ipa: word.ipa ?? null,
    });
    if (result.status === "error") {
      toast.error(result.source === "create" && result.code === "23505"
        ? `“${word.word}” already has a submission in this category.`
        : result.message);
      return;
    }
    if (result.status === "existing") {
      toast.info(result.requestStatus === "removed"
        ? "This request was removed and cannot be sent again."
        : "This word already has a review request.");
      return;
    }
    if (result.status === "resubmit_unavailable") {
      toast.info("This word is no longer available to resubmit. Refresh the page and try again.");
      return;
    }

    if (result.status === "resubmitted" || result.status === "created") {
      setStatus(REQUEST_SENT_MESSAGE);
      toast.success(result.status === "resubmitted" ? "Word request sent again." : "Word request sent.");
    }
  }

  return publishWord;
}
