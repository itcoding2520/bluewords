import { useState } from "react";
import { toast } from "sonner";
import { useVocabulary } from "@/contexts/VocabularyContext";
import {
  getPublishVocabularyOptions,
  normalize,
} from "@/lib/vocabulary/publish-options";
import { usePublishVocabularyRequests } from "@/hooks/usePublishVocabularyRequests";
import { usePublishCategoryRequest } from "@/hooks/usePublishCategoryRequest";
import { usePublishWordRequest } from "@/hooks/usePublishWordRequest";

export function usePublishVocabularyController() {
  const { words, categories, isAuthenticated, isLoaded } = useVocabulary();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
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
    if (!selectedCategories.length || busy) return;
    setBusy(true);
    setStatus("");
    try {
      for (const item of selectedCategories) await publishCategory(item);
      setSelectedCategories([]);
      await refreshRequests();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send category requests.");
    } finally {
      setBusy(false);
    }
  }

  async function sendWordRequests() {
    if (!selectedWordIds.length || busy) return;
    setBusy(true);
    setStatus("");
    try {
      for (const item of selectedWordIds) await publishWord(item);
      setSelectedWordIds([]);
      await refreshRequests();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send word requests.");
    } finally {
      setBusy(false);
    }
  }

  function toggleCategoryRequest(categoryName: string, checked: boolean) {
    const normalizedName = normalize(categoryName);
    setSelectedCategories((current) => checked
      ? current.includes(categoryName) ? current : [...current, categoryName]
      : current.filter((name) => name !== categoryName));
    const categoryWordIds = userWords
      .filter((word) => normalize(word.category) === normalizedName)
      .map((word) => word.id);
    setSelectedWordIds((current) => checked
      ? [...new Set([...current, ...categoryWordIds])]
      : current.filter((id) => !categoryWordIds.includes(id)));
  }

  return {
    isLoaded,
    isAuthenticated,
    selectedCategories,
    selectedWordIds,
    setSelectedWordIds,
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
    toggleCategoryRequest,
  };
}
