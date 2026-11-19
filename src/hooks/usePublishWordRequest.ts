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
import { getPublishWordRequestFeedback } from "@/lib/vocabulary/publish-word-request-feedback";
import { getCurrentSessionUserOrNull } from "@/lib/supabase/authenticated-user";

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
    const user = await getCurrentSessionUserOrNull(supabase);
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
    const feedback = getPublishWordRequestFeedback(result, word);
    if (!feedback) return;
    if (feedback.requestSent) setStatus(REQUEST_SENT_MESSAGE);
    if (feedback.kind === "error") toast.error(feedback.message);
    else if (feedback.kind === "info") toast.info(feedback.message);
    else toast.success(feedback.message);
  }

  return publishWord;
}
