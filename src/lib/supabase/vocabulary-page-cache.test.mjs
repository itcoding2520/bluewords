import assert from "node:assert/strict";
import test from "node:test";
import {
  getCachedVocabularyPage,
  invalidateVocabularyPageCache,
  setCachedVocabularyPage,
} from "./vocabulary-page-cache.mjs";

const query = { page: 1, pageSize: 10, search: "", category: null };

test("caches vocabulary pages by auth version and query", () => {
  invalidateVocabularyPageCache();
  const result = { rows: [{ id: "word-1" }], total: 1 };
  setCachedVocabularyPage(1, query, result);

  assert.equal(getCachedVocabularyPage(1, query), result);
  assert.equal(getCachedVocabularyPage(2, query), null);
  assert.equal(getCachedVocabularyPage(1, { ...query, page: 2 }), null);
});

test("invalidates cached vocabulary pages after vocabulary changes", () => {
  invalidateVocabularyPageCache();
  const result = { rows: [], total: 0 };
  setCachedVocabularyPage(1, query, result);

  invalidateVocabularyPageCache();
  assert.equal(getCachedVocabularyPage(1, query), null);
});
