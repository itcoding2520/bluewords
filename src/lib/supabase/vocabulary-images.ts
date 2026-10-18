import { createClient } from "@/lib/supabase/client";

export const VOCABULARY_IMAGES_BUCKET = "vocabulary-images";
export const MAX_VOCABULARY_IMAGE_SIZE = 5 * 1024 * 1024;

const supportedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const supabase = createClient();

export function validateVocabularyImage(file: File): string | null {
  if (!supportedImageTypes.has(file.type)) {
    return "Choose a JPEG, PNG, or WebP image.";
  }

  if (file.size > MAX_VOCABULARY_IMAGE_SIZE) {
    return "Image must be 5 MB or smaller.";
  }

  return null;
}

export async function uploadVocabularyImage(
  wordId: string,
  file: File
): Promise<string> {
  const validationError = validateVocabularyImage(file);
  if (validationError) throw new Error(validationError);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("You must be logged in to upload an image.");

  const extension = file.type === "image/jpeg" ? "jpg" : file.type.slice(6);
  const path = `${user.id}/${wordId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from(VOCABULARY_IMAGES_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (error) throw error;
  return path;
}

export async function deleteVocabularyImages(paths: Array<string | null | undefined>) {
  const safePaths = [...new Set(paths.filter((path): path is string => Boolean(path)))];
  if (safePaths.length === 0) return;

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("You must be logged in to delete images.");

  const ownedPaths = safePaths.filter((path) => path.startsWith(`${user.id}/`));
  if (ownedPaths.length !== safePaths.length) {
    throw new Error("Cannot delete an image outside your account.");
  }

  const { error } = await supabase.storage
    .from(VOCABULARY_IMAGES_BUCKET)
    .remove(ownedPaths);
  if (error) throw error;
}

export async function createVocabularyImageUrl(path: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(VOCABULARY_IMAGES_BUCKET)
      .createSignedUrl(path, 60 * 60);

    if (error) {
      console.warn("Could not create vocabulary image URL:", error.message);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.warn(
      "Could not create vocabulary image URL:",
      error instanceof Error ? error.message : "Storage request failed."
    );
    return null;
  }
}
