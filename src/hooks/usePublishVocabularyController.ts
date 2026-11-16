import { useVocabulary } from "@/contexts/VocabularyContext";
import { getPublishVocabularyOptions } from "@/lib/vocabulary/publish-options";
import { usePublishVocabularyRequests } from "@/hooks/usePublishVocabularyRequests";
import { usePublishCategoryRequest } from "@/hooks/usePublishCategoryRequest";
import { usePublishWordRequest } from "@/hooks/usePublishWordRequest";
import { usePublishVocabularySelection } from "@/hooks/usePublishVocabularySelection";
import { usePublishVocabularySubmission } from "@/hooks/usePublishVocabularySubmission";

export function usePublishVocabularyController() {
  const { words, categories, isAuthenticated, isLoaded } = useVocabulary();
  const {
    communityCategoryRequests,
    communityWordRequests,
    requestsLoaded,
    refreshRequests,
  } = usePublishVocabularyRequests(isAuthenticated);
  const submission = usePublishVocabularySubmission(refreshRequests);

  const {
    defaultCategoryNames,
    communityCategoryNames,
    defaultWordKeys,
    requestableCategories,
    requestableWords,
    userWords,
  } = getPublishVocabularyOptions({
    categories,
    words,
    categoryRequests: communityCategoryRequests,
    wordRequests: communityWordRequests,
  });
  const selection = usePublishVocabularySelection(userWords);

  const publishCategory = usePublishCategoryRequest(categories, submission.setStatus);

  const publishWord = usePublishWordRequest({
    userWords,
    requestableWords,
    communityWordRequests,
    defaultWordKeys,
    defaultCategoryNames,
    categories,
    setStatus: submission.setStatus,
  });

  function sendCategoryRequests() {
    return submission.sendRequests(
      selection.selectedCategories,
      publishCategory,
      () => selection.setSelectedCategories([]),
      "Could not send category requests.",
    );
  }

  function sendWordRequests() {
    return submission.sendRequests(
      selection.selectedWordIds,
      publishWord,
      () => selection.setSelectedWordIds([]),
      "Could not send word requests.",
    );
  }

  return {
    account: { isLoaded, isAuthenticated },
    requests: {
      requestsLoaded,
      communityCategoryRequests,
      communityWordRequests,
      communityCategoryNames,
    },
    selection: {
      selectedCategories: selection.selectedCategories,
      selectedWordIds: selection.selectedWordIds,
      setSelectedWordIds: selection.setSelectedWordIds,
      toggleCategoryRequest: selection.toggleCategoryRequest,
    },
    view: { requestableCategories, userWords },
    submission: { busy: submission.busy, status: submission.status },
    actions: { sendCategoryRequests, sendWordRequests },
  };
}
