import { readSessionStorageCache, removeSessionStorageCache, writeSessionStorageCache } from "./session-storage-cache.mjs";

const TTL_MS = 30_000;
const cache = new Map();
const inFlight = new Map();
let generation = 0;
const STORAGE_PREFIX = "bluewords:notifications:";

function readStoredNotifications(userId, now = Date.now()) {
  return readSessionStorageCache(`${STORAGE_PREFIX}${userId}`, now, TTL_MS,
    (stored, currentTime) => Array.isArray(stored.value) && Number.isFinite(stored.savedAt) && currentTime - stored.savedAt < TTL_MS);
}

export function peekCachedNotifications(userId) {
  const cached = cache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  return readStoredNotifications(userId)?.value ?? null;
}

export async function getCachedNotifications(userId, loader, { force = false, now = Date.now() } = {}) {
  if (!force) {
    const cached = cache.get(userId);
    if (cached && cached.expiresAt > now) return cached.value;
    const stored = readStoredNotifications(userId, now);
    if (stored) {
      cache.set(userId, stored);
      return stored.value;
    }
    const pending = inFlight.get(userId);
    if (pending) return pending;
  }

  const requestGeneration = generation;
  const request = Promise.resolve().then(loader).then((value) => {
    if (generation === requestGeneration && inFlight.get(userId) === request) {
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

export function invalidateNotificationsCache(userId) {
  generation += 1;
  if (userId) {
    cache.delete(userId);
    removeSessionStorageCache(`${STORAGE_PREFIX}${userId}`);
  }
  else cache.clear();
  inFlight.clear();
}

export function clearNotificationsCacheForTests() {
  cache.clear();
  inFlight.clear();
  generation = 0;
}
