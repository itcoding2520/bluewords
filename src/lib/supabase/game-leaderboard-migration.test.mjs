import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(
  new URL("./migrations/20261020180000_add_game_leaderboards.sql", import.meta.url),
  "utf8"
);

test("leaderboards expose only anonymized best results to authenticated users", () => {
  assert.match(migration, /SECURITY DEFINER[\s\S]*?SET search_path = ''/);
  assert.match(migration, /auth\.uid\(\) IS NULL/);
  assert.match(migration, /Player-' \|\| upper\(substr\(pg_catalog\.md5\(best\.user_id::text\), 1, 6\)\)/);
  assert.match(migration, /FROM PUBLIC, anon, authenticated/);
  assert.match(migration, /TO authenticated/);
  assert.doesNotMatch(migration, /email|expected_answer|selected_answer|image_path/i);
  assert.equal((migration.match(/ranked\.rank_position <= p_limit OR ranked\.is_you/g) ?? []).length, 2);
});

test("quiz leaderboard compares matching modes and question counts by score then time", () => {
  assert.match(migration, /s\.mode = p_mode[\s\S]*?s\.question_count = p_question_count/);
  assert.match(migration, /ORDER BY best\.correct_count DESC, best\.duration_seconds ASC/);
});

test("word search leaderboard compares matching board and difficulty by time", () => {
  assert.match(migration, /s\.grid_size = p_grid_size[\s\S]*?s\.difficulty = p_difficulty/);
  assert.match(migration, /ORDER BY best\.duration_seconds ASC, best\.word_count DESC/);
});
