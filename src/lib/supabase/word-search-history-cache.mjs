import { createUserPageCache } from "./user-page-cache.mjs";

const historyByPage = createUserPageCache();

/**
 * @template T
 * @param {string} userId
 * @param {number} [page]
 * @param {number} [pageSize]
 * @returns {T | null}
 */
export function getCachedWordSearchHistory(userId, page = 1, pageSize = 10) {
  return historyByPage.get(userId, page, pageSize);
}

/**
 * @template T
 * @param {string} userId
 * @param {number} page
 * @param {number} pageSize
 * @param {T} result
 * @returns {void}
 */
export function setCachedWordSearchHistory(userId, page, pageSize, result) {
  historyByPage.set(userId, page, pageSize, result);
}

export function invalidateWordSearchHistoryCache(userId) {
  historyByPage.invalidate(userId);
}
