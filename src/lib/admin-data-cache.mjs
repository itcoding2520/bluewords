const DEFAULT_TTL_MS = 30_000;
const cache = new Map();
const inFlight = new Map();
let generation = 0;

/**
 * Reuse recent admin data during client-side navigation and deduplicate
 * concurrent loads. Pass force=true for explicit refreshes.
 */
export async function getAdminCachedData(key, loader, { force = false, ttlMs = DEFAULT_TTL_MS, now = Date.now() } = {}) {
  if (!force) {
    const cached = cache.get(key);
    if (cached && cached.expiresAt > now) return cached.value;

    const pending = inFlight.get(key);
    if (pending) return pending;
  }

  const requestGeneration = generation;
  const request = Promise.resolve().then(loader).then((value) => {
    if (generation === requestGeneration && inFlight.get(key) === request) {
      cache.set(key, { value, expiresAt: Date.now() + ttlMs });
    }
    return value;
  }).finally(() => {
    if (inFlight.get(key) === request) inFlight.delete(key);
  });
  inFlight.set(key, request);
  return request;
}

export function invalidateAdminDataCache() {
  generation += 1;
  cache.clear();
  inFlight.clear();
}

export function clearAdminDataCacheForTests() {
  cache.clear();
  inFlight.clear();
  generation = 0;
}
