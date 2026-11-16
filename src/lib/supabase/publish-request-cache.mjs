import { readSessionStorageCache, removeSessionStorageCache, writeSessionStorageCache } from "../session-storage-cache.mjs";

const TTL_MS = 30_000;
const STORAGE_PREFIX = "bluewords:publish-requests:";
const cache = new Map();
const inFlight = new Map();
const generations = new Map();

function readStored(userId, now = Date.now()) {
  return readSessionStorageCache(`${STORAGE_PREFIX}${userId}`, now, TTL_MS,
    (stored, currentTime) => Array.isArray(stored.value?.categories)
      && Array.isArray(stored.value?.words)
      && Number.isFinite(stored.savedAt)
      && currentTime - stored.savedAt < TTL_MS);
}

export function peekCachedPublishRequests(userId, now = Date.now()) {
  const cached = cache.get(userId);
  if (cached && cached.expiresAt > now) return cached.value;
  return readStored(userId, now)?.value ?? null;
}

export async function getCachedPublishRequests(userId, loader, { force = false, now = Date.now() } = {}) {
  if (!force) {
    const cached = cache.get(userId);
    if (cached && cached.expiresAt > now) return cached.value;
    const stored = readStored(userId, now);
    if (stored) {
      cache.set(userId, stored);
      return stored.value;
    }
    const pending = inFlight.get(userId);
    if (pending) return pending;
  }

  const generation = generations.get(userId) ?? 0;
  const request = Promise.resolve().then(loader).then((value) => {
    if ((generations.get(userId) ?? 0) === generation && inFlight.get(userId) === request) {
      const savedAt = Date.now();
      cache.set(userId, { value, expiresAt: savedAt + TTL_MS });
      writeSessionStorageCache(`${STORAGE_PREFIX}${userId}`, value, savedAt);
    }
    return value;
  }).finally(() => {
    if (inFlight.get(userId) === request) inFlight.delete(userId);
  });
  inFlight.set(userId, request);
  return request;
}

export function invalidatePublishRequestCache(userId) {
  if (!userId) {
    cache.clear();
    inFlight.clear();
    generations.clear();
    return;
  }
  cache.delete(userId);
  inFlight.delete(userId);
  generations.set(userId, (generations.get(userId) ?? 0) + 1);
  removeSessionStorageCache(`${STORAGE_PREFIX}${userId}`);
}
