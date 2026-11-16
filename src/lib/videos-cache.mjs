import { clearSessionStorageCachePrefix, readSessionStorageCache, writeSessionStorageCache } from "./session-storage-cache.mjs";

const TTL_MS = 30_000;
const STORAGE_PREFIX = "bluewords:videos:";
const cache = new Map();
const inFlight = new Map();
let generation = 0;

function key(page, pageSize) {
  return `${page}:${pageSize}`;
}

function readStored(cacheKey, now = Date.now()) {
  return readSessionStorageCache(`${STORAGE_PREFIX}${cacheKey}`, now, TTL_MS,
    (stored, currentTime) => Array.isArray(stored.value?.videos) && Number.isFinite(stored.value?.total) && Number.isFinite(stored.savedAt) && currentTime - stored.savedAt < TTL_MS);
}

/**
 * @template T
 * @param {number} page
 * @param {number} pageSize
 * @param {number} [now]
 * @returns {T | null}
 */
export function peekCachedVideosPage(page, pageSize, now = Date.now()) {
  const cacheKey = key(page, pageSize);
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > now) return cached.value;
  const stored = readStored(cacheKey, now);
  if (stored) {
    cache.set(cacheKey, stored);
    return stored.value;
  }
  return null;
}

/**
 * @template T
 * @param {number} page
 * @param {number} pageSize
 * @param {() => Promise<T>} loader
 * @returns {Promise<T>}
 */
export async function getCachedVideosPage(page, pageSize, loader) {
  const cacheKey = key(page, pageSize);
  /** @type {T | null} */
  const cached = peekCachedVideosPage(page, pageSize);
  if (cached) return cached;
  const pending = inFlight.get(cacheKey);
  if (pending) return pending;

  const requestGeneration = generation;
  const request = Promise.resolve().then(loader).then((value) => {
    if (generation === requestGeneration && inFlight.get(cacheKey) === request) {
      const savedAt = Date.now();
      cache.set(cacheKey, { value, expiresAt: savedAt + TTL_MS });
      writeSessionStorageCache(`${STORAGE_PREFIX}${cacheKey}`, value, savedAt);
    }
    return value;
  }).finally(() => {
    if (inFlight.get(cacheKey) === request) inFlight.delete(cacheKey);
  });
  inFlight.set(cacheKey, request);
  return request;
}

export function invalidateVideosCache() {
  generation += 1;
  cache.clear();
  inFlight.clear();
  clearSessionStorageCachePrefix(STORAGE_PREFIX);
}
