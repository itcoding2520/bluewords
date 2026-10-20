import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL(
  "./migrations/20261020140000_fix_vocabulary_page_meaning_payload.sql",
  import.meta.url
);
const migration = await readFile(migrationUrl, "utf8");

test("vocabulary page RPC scopes rows to the signed-in user and supports pagination", () => {
  assert.match(migration, /v_user_id uuid := auth\.uid\(\)/i);
  assert.match(migration, /word\.user_id = v_user_id/i);
  assert.match(migration, /LIMIT p_page_size\s+OFFSET \(p_page - 1\) \* p_page_size/i);
  assert.match(migration, /ORDER BY word\.created_at DESC, word\.id DESC/i);
});

test("vocabulary page RPC searches legacy and detailed meanings and is authenticated-only", () => {
  assert.match(migration, /word\.word ILIKE/i);
  assert.match(migration, /word\.meaning ILIKE/i);
  assert.match(migration, /meaning\.meaning ILIKE/i);
  assert.match(migration, /SECURITY INVOKER/i);
  assert.match(migration, /FROM PUBLIC, anon/i);
  assert.match(migration, /TO authenticated/i);
});

test("vocabulary page RPC explicitly includes detailed meaning fields in its JSON payload", () => {
  assert.match(migration, /'vocabulary_meanings', COALESCE\(meanings\.items/i);
  assert.match(migration, /'part_of_speech', detail\.part_of_speech/i);
  assert.match(migration, /'meaning', detail\.meaning/i);
  assert.match(migration, /ORDER BY detail\.created_at ASC, detail\.id ASC/i);
});
