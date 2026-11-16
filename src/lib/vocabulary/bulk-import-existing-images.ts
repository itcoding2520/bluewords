import type { VocabularyWord } from "@/data/vocabulary";
import { normalizeVocabularyImageKey } from "@/lib/vocabulary/image-key";
import { importVocabularyWordImage } from "@/lib/vocabulary/import-image";
import { runWithConcurrency } from "@/lib/run-with-concurrency";

export { normalizeVocabularyImageKey } from "@/lib/vocabulary/image-key";

export interface ExistingVocabularyImageImportResult {
  imagesUploaded: number;
  imagesFailed: number;
  imageUpdates: Array<{ id: string; imagePath: string }>;
}

export async function importExistingVocabularyImages(
  imageFilesByWord: Map<string, File> | undefined,
  importedWords: VocabularyWord[],
  existingWords: VocabularyWord[]
): Promise<ExistingVocabularyImageImportResult> {
  const importedWordKeys = new Set(importedWords.map((word) => normalizeVocabularyImageKey(word.word)));
  const existingWordsWithoutImages = new Map<string, VocabularyWord>();
  for (const word of existingWords) {
    const key = normalizeVocabularyImageKey(word.word);
    if (!word.imagePath && !existingWordsWithoutImages.has(key)) {
      existingWordsWithoutImages.set(key, word);
    }
  }
  const existingImageCandidates = [...(imageFilesByWord ?? new Map<string, File>())].flatMap(([key, file]) => {
    if (importedWordKeys.has(key)) return [];
    const existingWord = existingWordsWithoutImages.get(key);
    return existingWord ? [{ word: existingWord, file }] : [];
  });
  const imageUpdates: ExistingVocabularyImageImportResult["imageUpdates"] = [];
  let imagesUploaded = 0;
  let imagesFailed = 0;

  await runWithConcurrency(existingImageCandidates, 4, async ({ word, file }) => {
    const result = await importVocabularyWordImage(word.id, word.word, file, "existing");
    if (result) {
      imageUpdates.push({ id: word.id, imagePath: result.imagePath });
      imagesUploaded++;
    } else {
      imagesFailed++;
    }
  });

  return { imagesUploaded, imagesFailed, imageUpdates };
}
