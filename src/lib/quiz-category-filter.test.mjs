import assert from "node:assert/strict";
import test from "node:test";

import { filterQuizWordsByCategory } from "./quiz-category-filter.mjs";

const words = [
  { word: "apple", category: "Fruits" },
  { word: "banana", category: "Fruits" },
  { word: "blue", category: "Colors" },
];

test("quiz category filter keeps the complete pool for All categories", () => {
  assert.equal(filterQuizWordsByCategory(words, "all"), words);
});

test("quiz category filter limits the pool to the selected category", () => {
  assert.deepEqual(
    filterQuizWordsByCategory(words, "Fruits").map((word) => word.word),
    ["apple", "banana"]
  );
});
