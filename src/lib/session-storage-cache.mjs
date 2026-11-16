/**
 * @param {string} key
 * @param {number} now
 * @param {number} ttlMs
 * @param {(stored: any, now: number, ttlMs: number) => boolean} isValid
 * @returns {{ value: any; expiresAt: number } | null}
 */
export function readSessionStorageCache(key, now, ttlMs, isValid) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const stored = JSON.parse(raw);
    if (!isValid(stored, now, ttlMs)) return null;
    return { value: stored.value, expiresAt: stored.savedAt + ttlMs };
  } catch {
    return null;
  }
}

/** @param {string} key @param {any} value @param {number} savedAt */
export function writeSessionStorageCache(key, value, savedAt) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify({ value, savedAt }));
  } catch { /* Storage is optional. */ }
}

/** @param {string} key */
export function removeSessionStorageCache(key) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(key);
  } catch { /* Storage is optional. */ }
}

/** @param {string} prefix */
export function clearSessionStorageCachePrefix(prefix) {
  if (typeof window === "undefined") return;
  try {
    for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = window.sessionStorage.key(index);
      if (key?.startsWith(prefix)) window.sessionStorage.removeItem(key);
    }
  } catch { /* Storage is optional. */ }
}
