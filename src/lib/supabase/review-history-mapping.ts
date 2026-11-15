import type { VocabularyStatus } from "@/data/vocabulary";
import type { VocabularyReviewRow } from "@/types/database";
import { getVocabularyWordImagePaths } from "@/lib/supabase/vocabulary";

export interface VocabularyReviewWithWord extends VocabularyReviewRow {
  vocabulary_words: {
    word: string;
    meaning: string;
    category: string;
    image_path: string | null;
    status: VocabularyStatus;
  } | null;
}

export interface LatestReviewRpcRow {
  id: string;
  user_id: string;
  vocabulary_word_id: string;
  remembered: boolean;
  reviewed_at: string;
  word: string;
  meaning: string;
  category: string;
  status: VocabularyStatus;
}

export async function mapLatestReviewRows(
  rows: LatestReviewRpcRow[]
): Promise<VocabularyReviewWithWord[]> {
  let imagePathByWordId = new Map<string, string | null>();
  const wordIds = [...new Set(rows.map((review) => review.vocabulary_word_id))];
  try {
    const imageRows = [];
    for (let start = 0; start < wordIds.length; start += 100) {
      imageRows.push(...await getVocabularyWordImagePaths(wordIds.slice(start, start + 100)));
    }
    imagePathByWordId = new Map(imageRows.map((row) => [row.id, row.image_path]));
  } catch {
    // Keep review history available if image metadata cannot be loaded.
  }

  return rows.map((review) => ({
    id: review.id,
    user_id: review.user_id,
    vocabulary_word_id: review.vocabulary_word_id,
    remembered: review.remembered,
    reviewed_at: review.reviewed_at,
    vocabulary_words: {
      word: review.word,
      meaning: review.meaning,
      category: review.category,
      image_path: imagePathByWordId.get(review.vocabulary_word_id) ?? null,
      status: review.status,
    },
  }));
}
