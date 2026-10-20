const pages = new Map();

function pageKey(authVersion, query) {
  return [
    authVersion,
    query.page,
    query.pageSize,
    query.search.trim().toLocaleLowerCase(),
    query.category ?? "*",
  ].join(":");
}

export function getCachedVocabularyPage(authVersion, query) {
  return pages.get(pageKey(authVersion, query)) ?? null;
}

export function setCachedVocabularyPage(authVersion, query, result) {
  pages.set(pageKey(authVersion, query), result);
}

export function invalidateVocabularyPageCache() {
  pages.clear();
}
