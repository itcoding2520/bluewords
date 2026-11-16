const pages = new Map();

function pageKey(authVersion, query) {
  return [
    authVersion,
    query.page,
    query.pageSize,
    query.search.trim().toLocaleLowerCase(),
    query.category ?? "*",
    query.status ?? "*",
  ].join(":");
}

/**
 * @template T
 * @param {number} authVersion
 * @param {{ page: number; pageSize: number; search: string; category: string | null; status: string | null }} query
 * @returns {T | null}
 */
export function getCachedVocabularyPage(authVersion, query) {
  return pages.get(pageKey(authVersion, query)) ?? null;
}

/**
 * @template T
 * @param {number} authVersion
 * @param {{ page: number; pageSize: number; search: string; category: string | null; status: string | null }} query
 * @param {T} result
 * @returns {void}
 */
export function setCachedVocabularyPage(authVersion, query, result) {
  pages.set(pageKey(authVersion, query), result);
}

export function invalidateVocabularyPageCache() {
  pages.clear();
}
