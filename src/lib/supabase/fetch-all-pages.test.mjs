import assert from "node:assert/strict";
import test from "node:test";

import { fetchAllPages } from "./fetch-all-pages.mjs";

test("fetches all pages and stops at the first partial page", async () => {
  const calls = [];
  const rows = await fetchAllPages(async (from, to) => {
    calls.push([from, to]);
    const source = ["a", "b", "c", "d", "e"];
    return { data: source.slice(from, to + 1), error: null };
  }, 2);

  assert.deepEqual(rows, ["a", "b", "c", "d", "e"]);
  assert.deepEqual(calls, [[0, 1], [2, 3], [4, 5]]);
});

test("requests an empty page when the result count is an exact page multiple", async () => {
  const calls = [];
  const rows = await fetchAllPages(async (from, to) => {
    calls.push([from, to]);
    return { data: from < 4 ? [from, from + 1] : [], error: null };
  }, 2);

  assert.deepEqual(rows, [0, 1, 2, 3]);
  assert.deepEqual(calls, [[0, 1], [2, 3], [4, 5]]);
});

test("returns an empty result when the first page is empty", async () => {
  const rows = await fetchAllPages(async () => ({ data: null, error: null }));

  assert.deepEqual(rows, []);
});

test("throws query errors without hiding them", async () => {
  const error = new Error("request failed");

  await assert.rejects(
    fetchAllPages(async () => ({ data: null, error })),
    (received) => received === error
  );
});

test("rejects invalid page sizes", async () => {
  await assert.rejects(
    fetchAllPages(async () => ({ data: [], error: null }), 0),
    RangeError
  );
});
