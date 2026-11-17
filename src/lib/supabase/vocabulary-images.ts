import { createClient } from "@/lib/supabase/client";
import { requireAuthenticatedUser } from "@/lib/supabase/authenticated-user";
import { MAX_STANDARD_IMAGE_SIZE, validateStandardImage } from "@/lib/image-validation";
import { VOCABULARY_IMAGES_BUCKET } from "@/lib/supabase/vocabulary-image-config";
import { invalidateVocabularyImageUrls } from "@/lib/supabase/vocabulary-image-urls";
import { uploadAuthenticatedImage } from "@/lib/supabase/storage-image-upload";

export { VOCABULARY_IMAGES_BUCKET } from "@/lib/supabase/vocabulary-image-config";
export { createVocabularyImageUrl, getCachedVocabularyImageUrl } from "@/lib/supabase/vocabulary-image-urls";
export const MAX_VOCABULARY_IMAGE_SIZE = MAX_STANDARD_IMAGE_SIZE;

const supabase = createClient();

export function validateVocabularyImage(file: File): string | null {
  return validateStandardImage(file);
}

export async function uploadVocabularyImage(
  wordId: string,
  file: File
): Promise<string> {
  const validationError = validateVocabularyImage(file);
  if (validationError) throw new Error(validationError);

  return uploadAuthenticatedImage({
    supabase,
    bucket: VOCABULARY_IMAGES_BUCKET,
    ownerFolder: wordId,
    file,
    authenticationError: "You must be logged in to upload an image.",
  });
}

export async function deleteVocabularyImages(paths: Array<string | null | undefined>) {
  const safePaths = [...new Set(paths.filter((path): path is string => Boolean(path)))];
  if (safePaths.length === 0) return;

  const user = await requireAuthenticatedUser(supabase, "You must be logged in to delete images.");

  // Starter images are shared assets and must never be removed by a user's
  // vocabulary edits or deletes.
  const ownedPaths = safePaths.filter(
    (path) => path.startsWith(`${user.id}/`) && !path.startsWith("default-vocabulary/")
  );
  const unsupportedPaths = safePaths.filter(
    (path) => !path.startsWith(`${user.id}/`) && !path.startsWith("default-vocabulary/")
  );
  if (unsupportedPaths.length > 0) {
    throw new Error("Cannot delete an image outside your account.");
  }

  if (ownedPaths.length === 0) return;

  const { error } = await supabase.storage
    .from(VOCABULARY_IMAGES_BUCKET)
    .remove(ownedPaths);
  if (error) throw error;

  invalidateVocabularyImageUrls(ownedPaths);
}
