import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL(
  "./migrations/20261019240000_validate_vocabulary_quiz_answer_snapshots.sql",
  import.meta.url
);
const migration = await readFile(migrationUrl, "utf8");

test("quiz history RPC validates contiguous answer positions", () => {
  assert.match(migration, /v_distinct_positions\s*<>\s*p_question_count/i);
  assert.match(migration, /v_first_position\s*<>\s*1/i);
  assert.match(migration, /v_last_position\s*<>\s*p_question_count/i);
});

test("quiz history RPC validates score against answer snapshots", () => {
  assert.match(migration, /v_correct_answer_count\s*<>\s*p_correct_count/i);
  assert.match(
    migration,
    /count\(\*\)\s+FILTER\s*\(WHERE\s*\(answers\.value->>'is_correct'\)::boolean\)/i
  );
});
