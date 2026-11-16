import type { VocabularyWord } from "@/data/vocabulary";
import { deleteVocabularyImages, uploadVocabularyImage } from "@/lib/supabase/vocabulary-images";
import { updateVocabularyWord } from "@/lib/supabase/vocabulary";
import { normalizeVocabularyImageKey } from "@/lib/vocabulary/image-key";

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
  const existingImageCandidates = [...(imageFilesByWord ?? new Map<string, File>())].flatMap(([key, file]) => {
    if (importedWordKeys.has(key)) return [];
    const existingWord = existingWords.find((word) =>
      normalizeVocabularyImageKey(word.word) === key && !word.imagePath
    );
    return existingWord ? [{ word: existingWord, file }] : [];
  });
  const imageUpdates: ExistingVocabularyImageImportResult["imageUpdates"] = [];
  let imagesUploaded = 0;
  let imagesFailed = 0;
  let imageIndex = 0;

  async function importNextExistingImage() {
    while (imageIndex < existingImageCandidates.length) {
      const { word, file } = existingImageCandidates[imageIndex++];
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
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(4, existingImageCandidates.length) }, () => importNextExistingImage()),
  );

  return { imagesUploaded, imagesFailed, imageUpdates };
}
