import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { useAdminReviewData } from "@/hooks/useAdminReviewData";
import { useAdminReviewModeration } from "@/hooks/useAdminReviewModeration";
import { useAdminPublishedVocabularyActions } from "@/hooks/useAdminPublishedVocabularyActions";

export function useAdminReviewController() {
  const supabase = useSupabaseClient();
  const reviewData = useAdminReviewData();
  const {
    categories,
    words,
    loading,
    error,
    setError,
    publishedCategories,
    publishedWords,
    ownerEmails,
    refresh,
  } = reviewData;
  const { busy, blockedWordId, moderate } = useAdminReviewModeration(supabase, reviewData);
  const publishedActions = useAdminPublishedVocabularyActions(supabase, setError, refresh);

  return {
    requests: { categories, words, ownerEmails },
    published: {
      categories: publishedCategories,
      words: publishedWords,
      newCategory: publishedActions.newCategory,
      setNewCategory: publishedActions.setNewCategory,
      newWord: publishedActions.newWord,
      setNewWord: publishedActions.setNewWord,
      newMeaning: publishedActions.newMeaning,
      setNewMeaning: publishedActions.setNewMeaning,
      newWordCategory: publishedActions.newWordCategory,
      setNewWordCategory: publishedActions.setNewWordCategory,
    },
    status: { loading, error, busy, blockedWordId },
    actions: {
      refresh,
      moderate,
      addPublishedCategory: publishedActions.addPublishedCategory,
      addPublishedWord: publishedActions.addPublishedWord,
      removePublished: publishedActions.removePublished,
      editPublishedWord: publishedActions.editPublishedWord,
      editPublishedCategory: publishedActions.editPublishedCategory,
    },
  };
}
