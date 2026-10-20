import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./quiz.ts", import.meta.url), "utf8");
const migration = await readFile(
  new URL("./migrations/20261020170000_sort_quiz_history_by_score_and_time.sql", import.meta.url),
  "utf8"
);

test("quiz history prioritizes perfect scores, then fastest durations", () => {
  const perfectOrder = source.indexOf('.order("is_perfect", { ascending: false })');
  const durationOrder = source.indexOf('.order("duration_seconds", { ascending: true })');
  const completionTieBreaker = source.indexOf('.order("completed_at", { ascending: false })');
  const stableTieBreaker = source.indexOf('.order("id", { ascending: false })');

  assert.ok(perfectOrder >= 0);
  assert.ok(durationOrder > perfectOrder);
  assert.ok(completionTieBreaker > durationOrder);
  assert.ok(stableTieBreaker > completionTieBreaker);
});

test("quiz history sort is backed by a generated score flag and matching index", () => {
  assert.match(migration, /GENERATED ALWAYS AS \(correct_count = question_count\) STORED/);
  assert.match(migration, /user_id,\s+is_perfect DESC,\s+duration_seconds ASC,\s+completed_at DESC,\s+id DESC/s);
});
