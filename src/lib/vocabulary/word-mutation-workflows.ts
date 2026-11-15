import type { VocabularyWord } from "@/data/vocabulary";
import {
  addVocabularyWord,
  deleteVocabularyWord,
  getVocabularyWordById,
  updateVocabularyWordWithMeanings,
} from "@/lib/supabase/vocabulary";
import { saveVocabularyMeanings } from "@/lib/supabase/vocabulary-meanings";
import { mapVocabularyMutationWord } from "@/lib/vocabulary/word-mutations";
import { normalizeVocabularyKey } from "@/lib/vocabulary/normalize-text";
import { resolveVocabularyIpa } from "@/lib/vocabulary/resolve-ipa";

export async function createVocabularyWordRecord(word: VocabularyWord): Promise<VocabularyWord> {
  const type = word.type ?? "word";
  const ipa = await resolveVocabularyIpa({ word: word.word, type, providedIpa: word.ipa });
  const row = await addVocabularyWord({
    word: word.word,
    meaning: word.meaning,
    category: word.category,
    status: word.status,
    type,
    ipa,
    image_path: word.imagePath ?? null,
  });

  try {
    const meanings = await saveVocabularyMeanings(row.id, word.detailedMeanings ?? []);
    return mapVocabularyMutationWord(row, meanings);
  } catch (error) {
    try {
      await deleteVocabularyWord(row.id);
    } catch (rollbackError) {
      console.error("Failed to roll back vocabulary after meaning save error:", rollbackError);
    }
    throw error;
  }
}

export async function updateVocabularyWordRecord(
  updatedWord: VocabularyWord,
  currentWord: VocabularyWord | undefined
): Promise<{ word: VocabularyWord; previousImagePath: string | null }> {
  const storedWord = currentWord ? null : await getVocabularyWordById(updatedWord.id);
  const previousImagePath = currentWord?.imagePath ?? storedWord?.image_path ?? null;
  const previousIpa = currentWord?.ipa ?? storedWord?.ipa ?? updatedWord.ipa;
  const type = updatedWord.type ?? "word";
  const wordChanged = normalizeVocabularyKey(
    currentWord?.word ?? storedWord?.word ?? updatedWord.word
  ) !== normalizeVocabularyKey(updatedWord.word);
  const ipa = await resolveVocabularyIpa({
    word: updatedWord.word,
    type,
    providedIpa: updatedWord.ipa,
    existingIpa: wordChanged ? null : previousIpa,
  });
  const { word: row, meanings } = await updateVocabularyWordWithMeanings({
    id: updatedWord.id,
    word: updatedWord.word,
    meaning: updatedWord.meaning,
    category: updatedWord.category,
    status: updatedWord.status,
    type,
    ipa,
    image_path: updatedWord.imagePath ?? null,
    meanings: (updatedWord.detailedMeanings ?? currentWord?.detailedMeanings ?? [])
      .filter((item) => item.meaning.trim())
      .map((item) => ({ part_of_speech: item.partOfSpeech, meaning: item.meaning.trim() })),
  });

  return { word: mapVocabularyMutationWord(row, meanings), previousImagePath };
}
