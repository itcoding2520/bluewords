import type { VocabularyWord } from "@/data/vocabulary";
import type { VocabularyCsvWord } from "@/lib/vocabulary-csv";
import {
  addVocabularyWord,
  deleteVocabularyWord,
  updateVocabularyWord,
} from "@/lib/supabase/vocabulary";
import {
  deleteVocabularyImages,
  uploadVocabularyImage,
} from "@/lib/supabase/vocabulary-images";
import { saveVocabularyMeanings } from "@/lib/vocabulary/meaning-workflows";
import { normalizeVocabularyImageKey } from "@/lib/vocabulary/bulk-import-existing-images";
import { resolveVocabularyIpa } from "@/lib/vocabulary/resolve-ipa";

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
  let insertedId: string | null = null;
  let imagesUploaded = 0;
  let imagesFailed = 0;

  try {
    const row = await addVocabularyWord({
      word: word.word,
      meaning: word.meaning,
      category: word.category,
      status: word.status,
      type: word.type ?? "word",
      ipa: await resolveVocabularyIpa({ word: word.word, type: word.type ?? "word", providedIpa: word.ipa }),
      image_path: word.imagePath ?? null,
    });
    insertedId = row.id;

    const detailedMeanings = await saveVocabularyMeanings(
      row.id,
      word.detailedMeanings ?? [],
    );

    let imagePath = row.image_path ?? null;
    const imageFile = imageFilesByWord?.get(normalizeVocabularyImageKey(word.word));
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

    return {
      status: "imported",
      word: {
        id: row.id,
        word: row.word,
        meaning: row.meaning,
        category: row.category,
        status: row.status,
        type: row.type ?? "word",
        ipa: row.ipa ?? null,
        imagePath,
        detailedMeanings,
      },
      imagesUploaded,
      imagesFailed,
    };
  } catch (error) {
    if (insertedId) {
      try {
        await deleteVocabularyWord(insertedId);
      } catch (rollbackError) {
        console.error("Failed to roll back CSV import word:", word.word, rollbackError);
      }
    }

    if (getErrorCode(error) === "23505") return { status: "duplicate" };
    console.error("Failed to import CSV vocabulary:", word.word, error);
    return { status: "failed" };
  }
}
