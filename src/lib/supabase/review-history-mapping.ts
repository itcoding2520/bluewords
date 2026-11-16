import type { VocabularyStatus } from "@/data/vocabulary";
import type { VocabularyReviewRow } from "@/types/database";
import { getVocabularyWordImagePaths } from "@/lib/supabase/vocabulary";
import { chunkArray } from "@/lib/chunk-array";

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
  const wordIds = new Set<string>();
  for (const review of rows) wordIds.add(review.vocabulary_word_id);
  const imagePathByWordId = new Map<string, string | null>();
  try {
    for (const ids of chunkArray([...wordIds], 100)) {
      const imageRows = await getVocabularyWordImagePaths(ids);
      for (const row of imageRows) imagePathByWordId.set(row.id, row.image_path);
    }
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
