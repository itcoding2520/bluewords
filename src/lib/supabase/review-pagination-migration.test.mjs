import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL(
  "./migrations/20261019250000_add_latest_vocabulary_review_counts.sql",
  import.meta.url
);
const migration = await readFile(migrationUrl, "utf8");

test("review count RPC only counts the authenticated user's latest result per word", () => {
  assert.match(migration, /DISTINCT ON \(review\.vocabulary_word_id\)/i);
  assert.match(migration, /review\.user_id\s*=\s*\(SELECT auth\.uid\(\)\)/i);
  assert.match(migration, /GROUP BY latest\.remembered/i);
});

test("review count RPC is executable only by authenticated users", () => {
  assert.match(migration, /SECURITY INVOKER/i);
  assert.match(migration, /FROM PUBLIC, anon, authenticated/i);
  assert.match(migration, /TO authenticated/i);
});
