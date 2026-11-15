import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import type { CommunityWordRequest } from "@/lib/vocabulary/publish-options";
import {
  createCommunityCategoryForWordRequest,
  createCommunityWordRequest,
  findCommunityCategory,
  findOwnedVocabularyWord,
  findOwnCommunityWordRequest,
  findPublishedCommunityWord,
  resubmitCommunityWordRequest,
} from "@/lib/supabase/publish-word-request";

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
    if (wordId.startsWith("retry-word-")) {
      const previousRequestId = wordId.slice("retry-word-".length);
      const ownRejectedRequest = communityWordRequests.some((request) =>
        request.id === previousRequestId && request.owner_id === user.id && request.status === "rejected"
      );
      if (!ownRejectedRequest) {
        toast.error("You can only resubmit a rejected word request that you created.");
        return;
      }
    } else {
      const { data: ownWord, error: ownershipError } = await findOwnedVocabularyWord(supabase, word.id, user.id);
      if (ownershipError) { toast.error(ownershipError.message); return; }
      if (!ownWord) {
        toast.error("You can only request words from your own vocabulary.");
        return;
      }
    }
    const normalizedCategory = word.category.trim().replace(/\s+/g, " ").toLowerCase();
    const normalizedWord = word.word.trim().replace(/\s+/g, " ").toLowerCase();
    if (defaultWordKeys.has(`${normalizedCategory}\u0000${normalizedWord}`)) {
      toast.info(`“${word.word}” is already part of the default vocabulary in ${word.category}.`);
      return;
    }
    const categoryResult = await findCommunityCategory(supabase, normalizedCategory);
    if (categoryResult.error) { toast.error(categoryResult.error.message); return; }
    let communityCategory = categoryResult.data;
    if (!communityCategory) {
      if (defaultCategoryNames.has(normalizedCategory)) {
        toast.error("This shared category is not available for word requests yet. Refresh the page and try again.");
        return;
      }
      const category = categories.find((item) => item.name === word.category);
      const created = await createCommunityCategoryForWordRequest(supabase, {
        ownerId: user.id,
        name: word.category,
        color: category?.color ?? "blue",
        imagePath: category?.image_path ?? null,
      });
      if (created.error) {
        toast.error(created.error.code === "23505" ? "This category already has a review request." : created.error.message);
        return;
      }
      communityCategory = created.data;
    }
    if (!communityCategory) { toast.error("Could not locate the category."); return; }
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
    const previous = await findOwnCommunityWordRequest(supabase, {
      ownerId: user.id,
      categoryId: communityCategory.id,
      normalizedWord,
    });
    if (previous.error) { toast.error(previous.error.message); return; }
    if (previous.data) {
      if (previous.data.status !== "rejected") {
        toast.info(previous.data.status === "removed"
          ? "This request was removed and cannot be sent again."
          : "This word already has a review request.");
        return;
      }
      const { data: updated, error } = await resubmitCommunityWordRequest(supabase, {
        id: previous.data.id,
        ownerId: user.id,
        word: word.word,
        meaning: word.meaning,
        ipa: word.ipa ?? null,
      });
      if (error) toast.error(error.message);
      else if (!updated) toast.info("This word is no longer available to resubmit. Refresh the page and try again.");
      else {
        setStatus(REQUEST_SENT_MESSAGE);
        toast.success("Word request sent again.");
      }
      return;
    }
    const { error } = await createCommunityWordRequest(supabase, {
      ownerId: user.id,
      categoryId: communityCategory.id,
      vocabularyWordId: word.id,
      word: word.word,
      meaning: word.meaning,
      ipa: word.ipa ?? null,
    });
    if (error) toast.error(error.code === "23505"
      ? `“${word.word}” already has a submission in this category.`
      : error.message);
    else {
      setStatus(REQUEST_SENT_MESSAGE);
      toast.success("Word request sent.");
    }
  }

  return publishWord;
}
