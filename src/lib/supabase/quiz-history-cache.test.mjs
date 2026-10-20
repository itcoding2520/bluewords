import assert from "node:assert/strict";
import test from "node:test";
import {
  getCachedQuizAnswers,
  getCachedQuizHistory,
  invalidateQuizHistoryCache,
  setCachedQuizAnswers,
  setCachedQuizHistory,
} from "./quiz-history-cache.mjs";

test("caches quiz history and answers per user", () => {
  invalidateQuizHistoryCache();
  const history = [{ id: "session-1" }];
  const answers = [{ id: "answer-1" }];
  setCachedQuizHistory("user-1", 1, 10, history);
  setCachedQuizAnswers("user-1", "session-1", answers);

  assert.equal(getCachedQuizHistory("user-1", 1, 10), history);
  assert.equal(getCachedQuizAnswers("user-1", "session-1"), answers);
  assert.equal(getCachedQuizHistory("user-2", 1, 10), null);
  assert.equal(getCachedQuizAnswers("user-2", "session-1"), null);
});

test("invalidates only the selected user's quiz history and answers", () => {
  invalidateQuizHistoryCache();
  setCachedQuizHistory("user-1", 1, 10, []);
  setCachedQuizAnswers("user-1", "session-1", []);
  setCachedQuizHistory("user-2", 1, 10, []);

  invalidateQuizHistoryCache("user-1");

  assert.equal(getCachedQuizHistory("user-1", 1, 10), null);
  assert.equal(getCachedQuizAnswers("user-1", "session-1"), null);
  assert.deepEqual(getCachedQuizHistory("user-2", 1, 10), []);
});
