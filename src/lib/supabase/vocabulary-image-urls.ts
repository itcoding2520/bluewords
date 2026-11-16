import { getErrorMessage } from "@/lib/errors";
import { scheduleDeferredTask } from "@/lib/schedule-deferred-task";
import { createClient } from "@/lib/supabase/client";
import { VOCABULARY_IMAGES_BUCKET } from "@/lib/supabase/vocabulary-image-config";

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

export function invalidateVocabularyImageUrls(paths: string[]) {
  for (const path of paths) signedUrlCache.delete(path);
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
    scheduleDeferredTask(() => void flushSignedUrlBatch());
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

    if (error) console.warn("Could not create vocabulary image URL:", error.message);

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
      getErrorMessage(error, "Storage request failed.")
    );
    for (const [path, resolve] of batch) {
      signedUrlRequests.delete(path);
      resolve(null);
    }
  }
}
