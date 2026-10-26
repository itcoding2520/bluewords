const TTL_MS = 30_000;
const STORAGE_PREFIX = "bluewords:publish-requests:";
const cache = new Map();
const inFlight = new Map();
const generations = new Map();

function readStored(userId, now = Date.now()) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (!raw) return null;
    const stored = JSON.parse(raw);
    if (
      !Array.isArray(stored.value?.categories) ||
      !Array.isArray(stored.value?.words) ||
      !Number.isFinite(stored.savedAt) ||
      now - stored.savedAt >= TTL_MS
    ) return null;
    return { value: stored.value, expiresAt: stored.savedAt + TTL_MS };
  } catch {
    return null;
  }
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
      if (typeof window !== "undefined") {
        try { window.sessionStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify({ value, savedAt })); } catch { /* Storage is optional. */ }
      }
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
  if (typeof window !== "undefined") {
    try { window.sessionStorage.removeItem(`${STORAGE_PREFIX}${userId}`); } catch { /* Storage is optional. */ }
  }
}
