import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCsvWord } from "@/lib/vocabulary-csv";
import { importVocabularyWords } from "@/lib/vocabulary/bulk-import";
import { invalidateVocabularyMutationCaches } from "@/lib/vocabulary/invalidate-mutation-caches";

interface VocabularyImportMutationOptions {
  words: VocabularyWord[];
  setWords: Dispatch<SetStateAction<VocabularyWord[]>>;
  ownerIdRef: MutableRefObject<string | null>;
}

export function useVocabularyImportMutations({
  words,
  setWords,
  ownerIdRef,
}: VocabularyImportMutationOptions) {
  async function importWords(
    importedWords: VocabularyCsvWord[],
    imageFilesByWord?: Map<string, File>
  ) {
    const result = await importVocabularyWords(importedWords, words, imageFilesByWord);

    if (result.importedWords.length > 0) {
      setWords((current) => [...result.importedWords, ...current]);
    }
    if (result.existingImageUpdates.length > 0) {
      const imagePaths = new Map(result.existingImageUpdates.map(({ id, imagePath }) => [id, imagePath]));
      setWords((current) => current.map((word) => {
        const imagePath = imagePaths.get(word.id);
        return imagePath ? { ...word, imagePath } : word;
      }));
    }
    if (result.imported > 0 || result.existingImageUpdates.length > 0) {
      invalidateVocabularyMutationCaches(ownerIdRef.current ?? undefined);
    }

    return {
      imported: result.imported,
      duplicates: result.duplicates,
      failed: result.failed,
      imagesUploaded: result.imagesUploaded,
      imagesFailed: result.imagesFailed,
      limitExceeded: result.limitExceeded,
    };
  }

  return { importWords };
}
