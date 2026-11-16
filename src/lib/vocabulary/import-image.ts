import { deleteVocabularyImages, uploadVocabularyImage } from "@/lib/supabase/vocabulary-images";
import { updateVocabularyWord } from "@/lib/supabase/vocabulary";

type VocabularyImageImportContext = "new" | "existing";

export async function importVocabularyWordImage(
  wordId: string,
  word: string,
  file: File,
  context: VocabularyImageImportContext,
): Promise<{ imagePath: string } | null> {
  let uploadedPath: string | null = null;
  try {
    uploadedPath = await uploadVocabularyImage(wordId, file);
    const updatedRow = await updateVocabularyWord(wordId, { image_path: uploadedPath });
    return { imagePath: updatedRow.image_path ?? uploadedPath };
  } catch (error) {
    if (uploadedPath) {
      try {
        await deleteVocabularyImages([uploadedPath]);
      } catch (cleanupError) {
        console.error("Failed to clean up imported vocabulary image:", cleanupError);
      }
    }
    if (context === "new") {
      console.error("Failed to import vocabulary image:", word, error);
    } else {
      console.error("Failed to import image for existing vocabulary:", word, error);
    }
    return null;
  }
}
