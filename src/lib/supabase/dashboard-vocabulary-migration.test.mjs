import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL(
  "./migrations/20261019270000_get_dashboard_vocabulary_overview.sql",
  import.meta.url
);
const migration = await readFile(migrationUrl, "utf8");

test("dashboard vocabulary RPC is authenticated and uses invoker permissions", () => {
  assert.match(migration, /SECURITY INVOKER/i);
  assert.match(migration, /words\.user_id\s*=\s*\(SELECT auth\.uid\(\)\)/i);
  assert.match(migration, /FROM PUBLIC, anon, authenticated/i);
  assert.match(migration, /TO authenticated/i);
});

test("dashboard overview returns counts and only the ten most recent words", () => {
  assert.match(migration, /count\(\*\) FILTER \(WHERE status = 'mastered'\)/i);
  assert.match(migration, /count\(\*\) FILTER \(WHERE status = 'learning'\)/i);
  assert.match(migration, /ORDER BY created_at DESC, id DESC\s+LIMIT 10/i);
  assert.match(migration, /'recentWords'/i);
  assert.match(migration, /'categoryColor'/i);
});
