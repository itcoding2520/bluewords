import { createClient } from "@/lib/supabase/client";
import type { VocabularyReviewRow } from "@/types/database";

const supabase = createClient();

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
    .select()
    .single();

  if (error) throw error;

  return data as VocabularyReviewRow;
}
