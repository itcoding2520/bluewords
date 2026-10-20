const historyByPage = new Map();

function key(userId, page, pageSize) {
  return `${userId}:${page}:${pageSize}`;
}

export function getCachedWordSearchHistory(userId, page = 1, pageSize = 10) {
  return historyByPage.get(key(userId, page, pageSize)) ?? null;
}

export function setCachedWordSearchHistory(userId, page, pageSize, result) {
  historyByPage.set(key(userId, page, pageSize), result);
}

export function invalidateWordSearchHistoryCache(userId) {
  if (!userId) {
    historyByPage.clear();
    return;
  }

  for (const cacheKey of historyByPage.keys()) {
    if (cacheKey.startsWith(`${userId}:`)) historyByPage.delete(cacheKey);
  }
}
