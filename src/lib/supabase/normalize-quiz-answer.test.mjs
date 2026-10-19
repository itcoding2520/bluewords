import assert from "node:assert/strict";
import test from "node:test";

import { normalizeQuizAnswer } from "./normalize-quiz-answer.mjs";

test("normalizes case and repeated whitespace consistently", () => {
  assert.equal(normalizeQuizAnswer("  GOOD\t morning  "), "good morning");
});

test("uses locale-independent Unicode lowercasing", () => {
  assert.equal(normalizeQuizAnswer("CAFÉ"), "café");
  assert.equal(normalizeQuizAnswer("I"), "i");
});
