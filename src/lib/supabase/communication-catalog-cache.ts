import { createInvalidatableAsyncCache } from "@/lib/supabase/invalidatable-async-cache.mjs";

const CACHE_TTL_MS = 60_000;
const cache = createInvalidatableAsyncCache();
const expirations = new Map<string, number>();
const lastSnapshots = new Map<string, unknown>();

export function invalidateCommunicationCatalogCache(userId: string): void {
  cache.invalidate(userId);
  expirations.delete(userId);
}

export function getCachedCommunicationCatalogSnapshot<T>(userId: string): T | undefined {
  return lastSnapshots.get(userId) as T | undefined;
}

export async function getCommunicationCatalogCache<T>(
  userId: string,
  load: () => Promise<T>,
): Promise<T> {
  if ((expirations.get(userId) ?? 0) <= Date.now()) {
    cache.invalidate(userId);
    // Set this before loading so concurrent route mounts share the same request.
    expirations.set(userId, Date.now() + CACHE_TTL_MS);
  }

  return cache.get(userId, async () => {
    const snapshot = await load();
    lastSnapshots.set(userId, snapshot);
    return snapshot;
  });
}
