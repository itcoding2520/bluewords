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
    categories, words, loading, error, busy, blockedWordId,
    publishedCategories, publishedWords, ownerEmails,
    ...publishedActions,
    refresh, moderate,
  };
}
