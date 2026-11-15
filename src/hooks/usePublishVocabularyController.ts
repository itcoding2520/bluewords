import { useState } from "react";
import { toast } from "sonner";
import { useVocabulary } from "@/contexts/VocabularyContext";
import { getPublishVocabularyOptions } from "@/lib/vocabulary/publish-options";
import { usePublishVocabularyRequests } from "@/hooks/usePublishVocabularyRequests";
import { usePublishCategoryRequest } from "@/hooks/usePublishCategoryRequest";
import { usePublishWordRequest } from "@/hooks/usePublishWordRequest";
import { usePublishVocabularySelection } from "@/hooks/usePublishVocabularySelection";

export function usePublishVocabularyController() {
  const { words, categories, isAuthenticated, isLoaded } = useVocabulary();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const {
    communityCategoryRequests,
    communityWordRequests,
    requestsLoaded,
    refreshRequests,
  } = usePublishVocabularyRequests(isAuthenticated);

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

  const publishCategory = usePublishCategoryRequest(categories, setStatus);

  const publishWord = usePublishWordRequest({
    userWords,
    requestableWords,
    communityWordRequests,
    defaultWordKeys,
    defaultCategoryNames,
    categories,
    setStatus,
  });

  async function sendRequests<T>(
    selected: T[],
    publish: (item: T) => Promise<void>,
    clearSelection: () => void,
    fallbackMessage: string,
  ) {
    if (!selected.length || busy) return;
    setBusy(true);
    setStatus("");
    try {
      for (const item of selected) await publish(item);
      clearSelection();
      await refreshRequests();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : fallbackMessage);
    } finally {
      setBusy(false);
    }
  }

  function sendCategoryRequests() {
    return sendRequests(
      selection.selectedCategories,
      publishCategory,
      () => selection.setSelectedCategories([]),
      "Could not send category requests.",
    );
  }

  function sendWordRequests() {
    return sendRequests(
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
    submission: { busy, status },
    actions: { sendCategoryRequests, sendWordRequests },
  };
}
