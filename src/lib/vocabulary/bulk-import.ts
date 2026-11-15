import type { VocabularyWord } from "@/data/vocabulary";
import {
  MAX_VOCABULARY_IMPORT_WORDS,
  type VocabularyCsvWord,
} from "@/lib/vocabulary-csv";
import { importExistingVocabularyImages } from "@/lib/vocabulary/bulk-import-existing-images";
import { importSingleVocabularyWord } from "@/lib/vocabulary/import-single-word";

export interface BulkVocabularyImportResult {
  imported: number;
  duplicates: number;
  failed: number;
  imagesUploaded: number;
  imagesFailed: number;
  limitExceeded?: boolean;
  importedWords: VocabularyWord[];
  existingImageUpdates: Array<{ id: string; imagePath: string }>;
}

export async function importVocabularyWords(
  importedWords: VocabularyCsvWord[],
  existingWords: VocabularyWord[],
  imageFilesByWord?: Map<string, File>,
): Promise<BulkVocabularyImportResult> {
  const emptyWords: VocabularyWord[] = [];
  const emptyImages: Array<{ id: string; imagePath: string }> = [];
  if (importedWords.length > MAX_VOCABULARY_IMPORT_WORDS) {
    return {
      imported: 0,
      duplicates: 0,
      failed: 0,
      imagesUploaded: 0,
      imagesFailed: 0,
      limitExceeded: true,
      importedWords: emptyWords,
      existingImageUpdates: emptyImages,
    };
  }

  let imported = 0;
  let duplicates = 0;
  let failed = 0;
  let imagesUploaded = 0;
  let imagesFailed = 0;
  let nextIndex = 0;
  const savedWords: VocabularyWord[] = [];

  async function importNext() {
    while (nextIndex < importedWords.length) {
      const word = importedWords[nextIndex++];
      const result = await importSingleVocabularyWord(word, imageFilesByWord);
      if (result.status === "duplicate") duplicates++;
      else if (result.status === "failed") failed++;
      else {
        imported++;
        imagesUploaded += result.imagesUploaded;
        imagesFailed += result.imagesFailed;
        savedWords.push(result.word);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(4, importedWords.length) }, () => importNext()),
  );

  const existingImageResult = await importExistingVocabularyImages(
    imageFilesByWord,
    savedWords,
    existingWords,
  );
  imagesUploaded += existingImageResult.imagesUploaded;
  imagesFailed += existingImageResult.imagesFailed;

  return {
    imported,
    duplicates,
    failed,
    imagesUploaded,
    imagesFailed,
    importedWords: savedWords.reverse(),
    existingImageUpdates: existingImageResult.imageUpdates,
  };
}
