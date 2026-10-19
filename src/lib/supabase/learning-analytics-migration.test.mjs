import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL(
  "./migrations/20261019260000_get_learning_analytics.sql",
  import.meta.url
);
const migration = await readFile(migrationUrl, "utf8");

test("learning analytics RPC is scoped to the authenticated user", () => {
  assert.match(migration, /SECURITY INVOKER/i);
  assert.match(migration, /review\.user_id\s*=\s*\(SELECT auth\.uid\(\)\)/i);
  assert.match(migration, /FROM PUBLIC, anon, authenticated/i);
  assert.match(migration, /TO authenticated/i);
});

test("learning analytics RPC aggregates review totals and Vietnam-local activity", () => {
  assert.match(migration, /count\(\*\) FILTER \(WHERE remembered\)/i);
  assert.match(migration, /AT TIME ZONE 'Asia\/Ho_Chi_Minh'/i);
  assert.match(migration, /generate_series\(0, 6\)/i);
  assert.match(migration, /'currentStreak'/i);
  assert.match(migration, /'dailyActivity'/i);
});
