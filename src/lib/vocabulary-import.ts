import { addVocabularyWord } from "@/lib/supabase/vocabulary";
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


export interface VocabularyImportResult {
  imported: number;
  duplicates: number;
  failed: number;
}

export async function importLegacyVocabulary(
  cloudWords: VocabularyWord[]
): Promise<VocabularyImportResult> {
  const preview = previewVocabularyImport(cloudWords);

  let imported = 0;
  let failed = 0;
  let duplicates = preview.duplicates;

  for (const item of preview.ready) {
    try {
      await addVocabularyWord({
        word: item.word.trim(),
        meaning: item.meaning.trim(),
        category: item.category,
        status: item.status,
      });

      imported++;
    } catch (error) {
      // PostgreSQL unique_violation:
      // Từ đã tồn tại, có thể do một phiên khác vừa thêm.
      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error
          ? error.code
          : null;

      if (code === "23505") {
        duplicates++;
      } else {
        failed++;
        console.error(
          "Failed to import vocabulary:",
          item.word,
          error
        );
      }
    }
  }

  return {
    imported,
    duplicates,
    failed,
  };
}
