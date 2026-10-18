import { createClient } from "@/lib/supabase/client";
import { invalidateLearningAnalyticsCache } from "@/lib/supabase/learning-analytics";
import type { VocabularyReviewRow } from "@/types/database";

const supabase = createClient();
const latestReviewsByUser = new Map<string, VocabularyReviewWithWord[]>();

export interface VocabularyReviewWithWord extends VocabularyReviewRow {
  vocabulary_words: {
    word: string;
    meaning: string;
    category: string;
  } | null;
}

export function getCachedLatestVocabularyReviews(
  userId: string
): VocabularyReviewWithWord[] | null {
  return latestReviewsByUser.get(userId) ?? null;
}

export function invalidateLatestVocabularyReviewsCache(): void {
  latestReviewsByUser.clear();
}

export async function getLatestVocabularyReviews(): Promise<
  VocabularyReviewWithWord[]
> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be logged in to view review history.");
  }

  const cachedReviews = latestReviewsByUser.get(user.id);
  if (cachedReviews) return cachedReviews;

  const { data, error } = await supabase
    .from("vocabulary_reviews")
    .select("id, user_id, vocabulary_word_id, remembered, reviewed_at, vocabulary_words!inner(word, meaning, category)")
    .eq("user_id", user.id)
    .order("reviewed_at", { ascending: false });

  if (error) throw error;

  const latestByWord = new Map<string, VocabularyReviewWithWord>();
  for (const review of (data ?? []) as unknown as VocabularyReviewWithWord[]) {
    if (!latestByWord.has(review.vocabulary_word_id)) {
      latestByWord.set(review.vocabulary_word_id, review);
    }
  }

  const reviews = [...latestByWord.values()];
  latestReviewsByUser.set(user.id, reviews);
  return reviews;
}

export async function recordVocabularyReview(
  vocabularyWordId: string,
  remembered: boolean
): Promise<VocabularyReviewRow> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You must be logged in to save a review.");
  }

  const { data, error } = await supabase
    .from("vocabulary_reviews")
    .insert({
      user_id: user.id,
      vocabulary_word_id: vocabularyWordId,
      remembered,
    })
    .select("id, user_id, vocabulary_word_id, remembered, reviewed_at, vocabulary_words!inner(word, meaning, category)")
    .single();

  if (error) throw error;

  invalidateLearningAnalyticsCache(user.id);

  const cachedReviews = latestReviewsByUser.get(user.id);
  if (cachedReviews) {
    const updatedReview = data as unknown as VocabularyReviewWithWord;
    latestReviewsByUser.set(user.id, [
      updatedReview,
      ...cachedReviews.filter(
        (review) => review.vocabulary_word_id !== vocabularyWordId
      ),
    ]);
  }

  return data as unknown as VocabularyReviewRow;
}
