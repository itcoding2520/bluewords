export function createUserPageCache() {
  const pages = new Map();

  function key(userId, page, pageSize) {
    return `${userId}:${page}:${pageSize}`;
  }

  function get(userId, page = 1, pageSize = 10) {
    return pages.get(key(userId, page, pageSize)) ?? null;
  }

  function set(userId, page, pageSize, value) {
    pages.set(key(userId, page, pageSize), value);
  }

  function invalidate(userId) {
    if (!userId) {
      pages.clear();
      return;
    }

    const prefix = `${userId}:`;
    for (const cacheKey of pages.keys()) {
      if (cacheKey.startsWith(prefix)) pages.delete(cacheKey);
    }
  }

  return { get, set, invalidate };
}
