import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./word-search-history.ts", import.meta.url), "utf8");

test("word search history groups by category and sorts faster durations first", () => {
  const categoryOrder = source.indexOf('.order("category", { ascending: true })');
  const durationOrder = source.indexOf('.order("duration_seconds", { ascending: true })');
  const completionTieBreaker = source.indexOf('.order("completed_at", { ascending: false })');

  assert.ok(categoryOrder >= 0);
  assert.ok(durationOrder > categoryOrder);
  assert.ok(completionTieBreaker > durationOrder);
});
