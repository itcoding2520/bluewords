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

  async function sendCategoryRequests() {
    if (!selection.selectedCategories.length || busy) return;
    setBusy(true);
    setStatus("");
    try {
      for (const item of selection.selectedCategories) await publishCategory(item);
      selection.setSelectedCategories([]);
      await refreshRequests();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send category requests.");
    } finally {
      setBusy(false);
    }
  }

  async function sendWordRequests() {
    if (!selection.selectedWordIds.length || busy) return;
    setBusy(true);
    setStatus("");
    try {
      for (const item of selection.selectedWordIds) await publishWord(item);
      selection.setSelectedWordIds([]);
      await refreshRequests();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send word requests.");
    } finally {
      setBusy(false);
    }
  }

  return {
    isLoaded,
    isAuthenticated,
    selectedCategories: selection.selectedCategories,
    selectedWordIds: selection.selectedWordIds,
    setSelectedWordIds: selection.setSelectedWordIds,
    busy,
    status,
    requestsLoaded,
    communityCategoryRequests,
    communityWordRequests,
    communityCategoryNames,
    requestableCategories,
    userWords,
    sendCategoryRequests,
    sendWordRequests,
    toggleCategoryRequest: selection.toggleCategoryRequest,
  };
}
