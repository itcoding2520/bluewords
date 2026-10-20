import assert from "node:assert/strict";
import test from "node:test";
import {
  getCachedWordSearchHistory,
  invalidateWordSearchHistoryCache,
  setCachedWordSearchHistory,
} from "./word-search-history-cache.mjs";

test("word search history cache is scoped by user and pagination", () => {
  invalidateWordSearchHistoryCache();
  const firstPage = { rows: [{ id: "session-1" }], total: 11 };
  setCachedWordSearchHistory("user-a", 1, 10, firstPage);

  assert.equal(getCachedWordSearchHistory("user-a", 1, 10), firstPage);
  assert.equal(getCachedWordSearchHistory("user-a", 2, 10), null);
  assert.equal(getCachedWordSearchHistory("user-b", 1, 10), null);
});

test("word search history invalidation only clears the requested user", () => {
  invalidateWordSearchHistoryCache();
  setCachedWordSearchHistory("user-a", 1, 10, { rows: [], total: 0 });
  setCachedWordSearchHistory("user-b", 1, 10, { rows: [], total: 0 });

  invalidateWordSearchHistoryCache("user-a");

  assert.equal(getCachedWordSearchHistory("user-a", 1, 10), null);
  assert.deepEqual(getCachedWordSearchHistory("user-b", 1, 10), { rows: [], total: 0 });
});
