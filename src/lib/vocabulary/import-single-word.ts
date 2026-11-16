import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCsvWord } from "@/lib/vocabulary-csv";
import { updateVocabularyWord } from "@/lib/supabase/vocabulary";
import {
  deleteVocabularyImages,
  uploadVocabularyImage,
} from "@/lib/supabase/vocabulary-images";
import { createVocabularyWordRecord } from "@/lib/vocabulary/word-mutation-workflows";
import { normalizeVocabularyImageKey } from "@/lib/vocabulary/bulk-import-existing-images";

export type SingleVocabularyImportResult =
  | { status: "duplicate" }
  | { status: "failed" }
  | {
      status: "imported";
      word: VocabularyWord;
      imagesUploaded: number;
      imagesFailed: number;
    };

function getErrorCode(error: unknown): unknown {
  if (typeof error !== "object" || error === null || !("code" in error)) return null;
  return error.code;
}

export async function importSingleVocabularyWord(
  word: VocabularyCsvWord,
  imageFilesByWord?: Map<string, File>,
): Promise<SingleVocabularyImportResult> {
  let imagesUploaded = 0;
  let imagesFailed = 0;

  try {
    const createdWord = await createVocabularyWordRecord({
      word: word.word,
      meaning: word.meaning,
      category: word.category,
      status: word.status,
      type: word.type ?? "word",
      ipa: word.ipa,
      imagePath: word.imagePath ?? null,
      detailedMeanings: word.detailedMeanings ?? [],
    });
    let imagePath = createdWord.imagePath;
    const imageFile = imageFilesByWord?.get(normalizeVocabularyImageKey(word.word));
    if (imageFile) {
      let uploadedPath: string | null = null;
      try {
        uploadedPath = await uploadVocabularyImage(createdWord.id, imageFile);
        const updatedRow = await updateVocabularyWord(createdWord.id, { image_path: uploadedPath });
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

    return {
      status: "imported",
      word: {
        ...createdWord,
        imagePath,
      },
      imagesUploaded,
      imagesFailed,
    };
  } catch (error) {
    if (getErrorCode(error) === "23505") return { status: "duplicate" };
    console.error("Failed to import CSV vocabulary:", word.word, error);
    return { status: "failed" };
  }
}
