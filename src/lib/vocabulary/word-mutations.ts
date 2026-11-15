import type { VocabularyMeaning, VocabularyWord } from "@/data/vocabulary";
import type { VocabularyMeaningRow, VocabularyWordRow } from "@/types/database";
import { mapVocabularyMeaning } from "@/lib/vocabulary/shared-vocabulary";

function normalizeDuplicateKey(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function hasDuplicateVocabularyWord(
  words: VocabularyWord[],
  candidate: Pick<VocabularyWord, "word" | "category">,
  excludeId?: string
): boolean {
  const categoryKey = normalizeDuplicateKey(candidate.category);
  const wordKey = normalizeDuplicateKey(candidate.word);

  return words.some((current) =>
    current.id !== excludeId
    && normalizeDuplicateKey(current.category) === categoryKey
    && normalizeDuplicateKey(current.word) === wordKey
  );
}

export function mapVocabularyMutationWord(
  row: VocabularyWordRow,
  meanings: VocabularyMeaningRow[] | VocabularyMeaning[] = []
): VocabularyWord {
  return {
    id: row.id,
    word: row.word,
    meaning: row.meaning,
    category: row.category,
    status: row.status,
    type: row.type ?? "word",
    ipa: row.ipa ?? null,
    imagePath: row.image_path ?? null,
    detailedMeanings: meanings.map((meaning) =>
      "part_of_speech" in meaning ? mapVocabularyMeaning(meaning) : meaning
    ),
  };
}
