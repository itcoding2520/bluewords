import type { VocabularyWord } from "@/data/vocabulary";
import { deleteVocabularyImages, uploadVocabularyImage } from "@/lib/supabase/vocabulary-images";
import { updateVocabularyWord } from "@/lib/supabase/vocabulary";
import { normalizeVocabularyImageKey } from "@/lib/vocabulary/image-key";
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
    let uploadedPath: string | null = null;
    try {
      uploadedPath = await uploadVocabularyImage(word.id, file);
      const row = await updateVocabularyWord(word.id, { image_path: uploadedPath });
      imageUpdates.push({ id: row.id, imagePath: row.image_path ?? uploadedPath });
      imagesUploaded++;
    } catch (imageError) {
      if (uploadedPath) {
        try {
          await deleteVocabularyImages([uploadedPath]);
        } catch (cleanupError) {
          console.error("Failed to clean up imported vocabulary image:", cleanupError);
        }
      }
      imagesFailed++;
      console.error("Failed to import image for existing vocabulary:", word.word, imageError);
    }
  });

  return { imagesUploaded, imagesFailed, imageUpdates };
}
