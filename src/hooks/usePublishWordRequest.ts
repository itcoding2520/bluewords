import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { verifyPublishWordRequestOwnership } from "@/lib/supabase/publish-word-request";
import type { CommunityWordRequest } from "@/lib/supabase/publish-vocabulary-request-types";
import {
  submitCommunityWordRequest,
  type PublishableWord,
} from "@/lib/vocabulary/publish-word-request-submission";

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
    const result = await submitCommunityWordRequest(supabase, {
      ownerId: user.id,
      word,
      defaultWordKeys,
      defaultCategoryNames,
      categories,
    });
    if (result.status === "default_word") {
      toast.info(`“${word.word}” is already part of the default vocabulary in ${word.category}.`);
      return;
    }

    if (result.status === "category_resolution_error") {
      toast.error(result.source === "create" && result.code === "23505"
        ? "This category already has a review request."
        : result.message);
      return;
    }
    if (result.status === "default_category_unavailable") {
      toast.error("This shared category is not available for word requests yet. Refresh the page and try again.");
      return;
    }
    if (result.status === "category_not_found") {
      toast.error("Could not locate the category.");
      return;
    }
    if (result.status === "category_not_available") {
      toast.error("Words can only be requested in your own or an approved category.");
      return;
    }
    if (result.status === "published_word_lookup_error") {
      toast.error(result.message);
      return;
    }
    if (result.status === "already_published") {
      toast.info(`“${word.word}” is already published in ${word.category}.`);
      return;
    }
    if (result.status !== "saved") return;

    if (result.result.status === "error") {
      toast.error(result.result.source === "create" && result.result.code === "23505"
        ? `“${word.word}” already has a submission in this category.`
        : result.result.message);
      return;
    }
    if (result.result.status === "existing") {
      toast.info(result.result.requestStatus === "removed"
        ? "This request was removed and cannot be sent again."
        : "This word already has a review request.");
      return;
    }
    if (result.result.status === "resubmit_unavailable") {
      toast.info("This word is no longer available to resubmit. Refresh the page and try again.");
      return;
    }

    if (result.result.status === "resubmitted" || result.result.status === "created") {
      setStatus(REQUEST_SENT_MESSAGE);
      toast.success(result.result.status === "resubmitted" ? "Word request sent again." : "Word request sent.");
    }
  }

  return publishWord;
}
