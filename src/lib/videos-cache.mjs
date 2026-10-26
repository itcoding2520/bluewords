const TTL_MS = 30_000;
const STORAGE_PREFIX = "bluewords:videos:";
const cache = new Map();
const inFlight = new Map();
let generation = 0;

function key(page, pageSize) {
  return `${page}:${pageSize}`;
}

function readStored(cacheKey, now = Date.now()) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(`${STORAGE_PREFIX}${cacheKey}`);
    if (!raw) return null;
    const stored = JSON.parse(raw);
    if (!Array.isArray(stored.value?.videos) || !Number.isFinite(stored.value?.total) || !Number.isFinite(stored.savedAt) || now - stored.savedAt >= TTL_MS) return null;
    return { value: stored.value, expiresAt: stored.savedAt + TTL_MS };
  } catch {
    return null;
  }
}

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

export async function getCachedVideosPage(page, pageSize, loader) {
  const cacheKey = key(page, pageSize);
  const cached = peekCachedVideosPage(page, pageSize);
  if (cached) return cached;
  const pending = inFlight.get(cacheKey);
  if (pending) return pending;

  const requestGeneration = generation;
  const request = Promise.resolve().then(loader).then((value) => {
    if (generation === requestGeneration && inFlight.get(cacheKey) === request) {
      const savedAt = Date.now();
      cache.set(cacheKey, { value, expiresAt: savedAt + TTL_MS });
      if (typeof window !== "undefined") {
        try { window.sessionStorage.setItem(`${STORAGE_PREFIX}${cacheKey}`, JSON.stringify({ value, savedAt })); } catch { /* Storage is optional. */ }
      }
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
  if (typeof window !== "undefined") {
    try {
      for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
        const storageKey = window.sessionStorage.key(index);
        if (storageKey?.startsWith(STORAGE_PREFIX)) window.sessionStorage.removeItem(storageKey);
      }
    } catch { /* Storage is optional. */ }
  }
}
