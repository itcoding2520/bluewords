import type { VocabularyWord } from "@/data/vocabulary";
import {
  MAX_VOCABULARY_IMPORT_WORDS,
  type VocabularyCsvWord,
} from "@/lib/vocabulary-csv";
import {
  addVocabularyWord,
  deleteVocabularyWord,
  updateVocabularyWord,
} from "@/lib/supabase/vocabulary";
import {
  deleteVocabularyImages,
  uploadVocabularyImage,
} from "@/lib/supabase/vocabulary-images";
import { fetchEnglishIpa } from "@/lib/dictionary";
import { saveVocabularyMeanings } from "@/lib/supabase/vocabulary-meanings";

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

function normalizeImageKey(word: string): string {
  return word
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getErrorCode(error: unknown): unknown {
  if (typeof error !== "object" || error === null || !("code" in error)) return null;
  return error.code;
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
  const savedExistingImages: Array<{ id: string; imagePath: string }> = [];

  async function importNext() {
    while (nextIndex < importedWords.length) {
      const word = importedWords[nextIndex++];
      let insertedId: string | null = null;

      try {
        const row = await addVocabularyWord({
          word: word.word,
          meaning: word.meaning,
          category: word.category,
          status: word.status,
          type: word.type ?? "word",
          ipa: (word.type ?? "word") === "word"
            ? word.ipa?.trim() || await fetchEnglishIpa(word.word)
            : null,
          image_path: word.imagePath ?? null,
        });
        insertedId = row.id;

        const detailedMeanings = await saveVocabularyMeanings(
          row.id,
          word.detailedMeanings ?? [],
        );

        let imagePath = row.image_path ?? null;
        const imageFile = imageFilesByWord?.get(normalizeImageKey(word.word));
        if (imageFile) {
          let uploadedPath: string | null = null;
          try {
            uploadedPath = await uploadVocabularyImage(row.id, imageFile);
            const updatedRow = await updateVocabularyWord(row.id, { image_path: uploadedPath });
            imagePath = updatedRow.image_path ?? uploadedPath;
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
            console.error("Failed to import vocabulary image:", word.word, imageError);
          }
        }

        savedWords.push({
          id: row.id,
          word: row.word,
          meaning: row.meaning,
          category: row.category,
          status: row.status,
          type: row.type ?? "word",
          ipa: row.ipa ?? null,
          imagePath,
          detailedMeanings,
        });
        imported++;
      } catch (error) {
        if (insertedId) {
          try {
            await deleteVocabularyWord(insertedId);
          } catch (rollbackError) {
            console.error("Failed to roll back CSV import word:", word.word, rollbackError);
          }
        }

        if (getErrorCode(error) === "23505") duplicates++;
        else {
          failed++;
          console.error("Failed to import CSV vocabulary:", word.word, error);
        }
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(4, importedWords.length) }, () => importNext()),
  );

  const importedWordKeys = new Set(savedWords.map((word) => normalizeImageKey(word.word)));
  const existingImageCandidates = [...(imageFilesByWord ?? new Map<string, File>())].flatMap(([key, file]) => {
    if (importedWordKeys.has(key)) return [];
    const existingWord = existingWords.find((word) =>
      normalizeImageKey(word.word) === key && !word.imagePath
    );
    return existingWord ? [{ word: existingWord, file }] : [];
  });
  let imageIndex = 0;

  async function importExistingImage() {
    while (imageIndex < existingImageCandidates.length) {
      const { word, file } = existingImageCandidates[imageIndex++];
      let uploadedPath: string | null = null;
      try {
        uploadedPath = await uploadVocabularyImage(word.id, file);
        const row = await updateVocabularyWord(word.id, { image_path: uploadedPath });
        savedExistingImages.push({ id: row.id, imagePath: row.image_path ?? uploadedPath });
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
    Array.from({ length: Math.min(4, existingImageCandidates.length) }, () => importExistingImage()),
  );

  return {
    imported,
    duplicates,
    failed,
    imagesUploaded,
    imagesFailed,
    importedWords: savedWords.reverse(),
    existingImageUpdates: savedExistingImages,
  };
}
