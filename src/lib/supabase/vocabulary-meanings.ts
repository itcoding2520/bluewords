import type { VocabularyMeaning } from "@/data/vocabulary";
import type { VocabularyMeaningRow } from "@/types/database";
import {
  addVocabularyMeaning,
  deleteVocabularyMeaning,
  getVocabularyMeanings,
  updateVocabularyMeaning,
} from "@/lib/supabase/vocabulary";
import { mapVocabularyMeaning } from "@/lib/vocabulary/shared-vocabulary";

export async function saveVocabularyMeanings(
  vocabularyWordId: string,
  meanings: VocabularyMeaning[],
): Promise<VocabularyMeaning[]> {
  const existingMeanings = await getVocabularyMeanings(vocabularyWordId);
  const existingById = new Map(existingMeanings.map((meaning) => [meaning.id, meaning]));
  const retainedIds = new Set<string>();
  const savedMeanings: VocabularyMeaningRow[] = [];

  for (const meaning of meanings) {
    const trimmedMeaning = meaning.meaning.trim();
    if (!trimmedMeaning) continue;

    const existing = meaning.id === undefined ? undefined : existingById.get(meaning.id);
    const saved = existing
      ? await updateVocabularyMeaning(existing.id, {
          part_of_speech: meaning.partOfSpeech,
          meaning: trimmedMeaning,
        })
      : await addVocabularyMeaning({
          vocabulary_word_id: vocabularyWordId,
          part_of_speech: meaning.partOfSpeech,
          meaning: trimmedMeaning,
        });

    retainedIds.add(saved.id);
    savedMeanings.push(saved);
  }

  for (const existing of existingMeanings) {
    if (!retainedIds.has(existing.id)) await deleteVocabularyMeaning(existing.id);
  }

  return savedMeanings.map(mapVocabularyMeaning);
}
