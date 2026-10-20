import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(new URL("./migrations/20261020150000_create_word_search_history.sql", import.meta.url), "utf8");

test("word search history is protected by user-scoped RLS and authenticated RPC", () => {
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/i);
  assert.match(migration, /USING \(user_id = \(SELECT auth\.uid\(\)\)\)/i);
  assert.match(migration, /WITH CHECK \([\s\S]*?user_id = \(SELECT auth\.uid\(\)\)/i);
  assert.match(migration, /GRANT SELECT, INSERT ON TABLE public\.word_search_sessions TO authenticated/i);
  assert.match(migration, /SECURITY INVOKER/i);
  assert.match(migration, /FROM PUBLIC, anon, authenticated/i);
  assert.match(migration, /TO authenticated/i);
});

test("word search history RPC validates completed game snapshots", () => {
  assert.match(migration, /p_grid_size NOT IN \(10, 20, 30\)/i);
  assert.match(migration, /p_difficulty NOT IN \('easy', 'medium', 'hard'\)/i);
  assert.match(migration, /jsonb_array_length\(p_words\) <> p_word_count/i);
  assert.match(migration, /p_completed_at < p_started_at/i);
});
