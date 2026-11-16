import { createUserPageCache } from "./user-page-cache.mjs";

const historyByPage = createUserPageCache();

export function getCachedWordSearchHistory(userId, page = 1, pageSize = 10) {
  return historyByPage.get(userId, page, pageSize);
}

export function setCachedWordSearchHistory(userId, page, pageSize, result) {
  historyByPage.set(userId, page, pageSize, result);
}

export function invalidateWordSearchHistoryCache(userId) {
  historyByPage.invalidate(userId);
}
