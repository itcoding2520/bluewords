
import type { VocabularyWord } from "@/data/vocabulary";
import { getLegacyVocabulary } from "@/lib/vocabulary-migration";

export interface VocabularyImportPreview {
  total: number;
  duplicates: number;
  ready: VocabularyWord[];
}

function normalizeWord(word: string): string {
  return word.trim().toLowerCase();
}

export function previewVocabularyImport(
  cloudWords: VocabularyWord[]
): VocabularyImportPreview {
  const legacyWords = getLegacyVocabulary();

  const existingWords = new Set(
    cloudWords.map((item) => normalizeWord(item.word))
  );

  const ready: VocabularyWord[] = [];
  let duplicates = 0;

  for (const item of legacyWords) {
    const normalized = normalizeWord(item.word);

    if (existingWords.has(normalized)) {
      duplicates++;
      continue;
    }

    ready.push(item);
    existingWords.add(normalized);
  }

  return {
    total: legacyWords.length,
    duplicates,
    ready,
  };
}
