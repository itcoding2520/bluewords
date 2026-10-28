import { createClient } from "@/lib/supabase/client";

export const VOCABULARY_IMAGES_BUCKET = "vocabulary-images";
export const MAX_VOCABULARY_IMAGE_SIZE = 5 * 1024 * 1024;

const supportedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const supabase = createClient();
const SIGNED_URL_TTL_MS = 55 * 60 * 1000;
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();
const signedUrlRequests = new Map<string, Promise<string | null>>();
const queuedSignedUrlRequests = new Map<string, (url: string | null) => void>();
let signedUrlBatchScheduled = false;

export function getCachedVocabularyImageUrl(path: string): string | null {
  const cached = signedUrlCache.get(path);
  if (!cached) return null;

  if (cached.expiresAt <= Date.now()) {
    signedUrlCache.delete(path);
    return null;
  }

  return cached.url;
}

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

  for (const path of ownedPaths) {
    signedUrlCache.delete(path);
  }
}

export async function createVocabularyImageUrl(path: string): Promise<string | null> {
  const cachedUrl = getCachedVocabularyImageUrl(path);
  if (cachedUrl) return cachedUrl;

  const pendingRequest = signedUrlRequests.get(path);
  if (pendingRequest) return pendingRequest;

  const request = new Promise<string | null>((resolve) => {
    queuedSignedUrlRequests.set(path, resolve);
  });
  signedUrlRequests.set(path, request);

  if (!signedUrlBatchScheduled) {
    signedUrlBatchScheduled = true;
    window.setTimeout(() => void flushSignedUrlBatch(), 0);
  }

  return request;
}

async function flushSignedUrlBatch() {
  signedUrlBatchScheduled = false;
  const batch = [...queuedSignedUrlRequests.entries()];
  queuedSignedUrlRequests.clear();
  if (batch.length === 0) return;

  try {
    const { data, error } = await supabase.storage
      .from(VOCABULARY_IMAGES_BUCKET)
      .createSignedUrls(batch.map(([path]) => path), 60 * 60);

    if (error) {
      console.warn("Could not create vocabulary image URL:", error.message);
    }

    const urls = new Map((data ?? []).map((item) => [item.path, item.signedUrl]));
    for (const [path, resolve] of batch) {
      const url = urls.get(path) ?? null;
      if (url) signedUrlCache.set(path, { url, expiresAt: Date.now() + SIGNED_URL_TTL_MS });
      signedUrlRequests.delete(path);
      resolve(url);
    }
  } catch (error) {
    console.warn(
      "Could not create vocabulary image URL:",
      error instanceof Error ? error.message : "Storage request failed."
    );
    for (const [path, resolve] of batch) {
      signedUrlRequests.delete(path);
      resolve(null);
    }
  }
}
