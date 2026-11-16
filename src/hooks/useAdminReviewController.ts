import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { useAdminReviewData } from "@/hooks/useAdminReviewData";
import { useAdminReviewModeration } from "@/hooks/useAdminReviewModeration";
import { useAdminPublishedVocabularyActions } from "@/hooks/useAdminPublishedVocabularyActions";
import { useAdminPublishedVocabularyForms } from "@/hooks/useAdminPublishedVocabularyForms";

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
  const publishedForms = useAdminPublishedVocabularyForms(supabase, setError, refresh);

  return {
    requests: { categories, words, ownerEmails },
    published: {
      categories: publishedCategories,
      words: publishedWords,
      newCategory: publishedForms.newCategory,
      setNewCategory: publishedForms.setNewCategory,
      newWord: publishedForms.newWord,
      setNewWord: publishedForms.setNewWord,
      newMeaning: publishedForms.newMeaning,
      setNewMeaning: publishedForms.setNewMeaning,
      newWordCategory: publishedForms.newWordCategory,
      setNewWordCategory: publishedForms.setNewWordCategory,
    },
    status: { loading, error, busy, blockedWordId },
    actions: {
      refresh,
      moderate,
      addPublishedCategory: publishedForms.addPublishedCategory,
      addPublishedWord: publishedForms.addPublishedWord,
      removePublished: publishedActions.removePublished,
      editPublishedWord: publishedActions.editPublishedWord,
      editPublishedCategory: publishedActions.editPublishedCategory,
    },
  };
}
