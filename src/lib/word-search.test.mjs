import assert from "node:assert/strict";
import test from "node:test";

import {
  createWordSearchPuzzle,
  findWordSearchSelection,
  findWordSearchSelectionPrefix,
  getWordSearchSelectionPath,
  normalizeWordSearchWord,
} from "./word-search.mjs";

function seededRandom(seed = 17) {
  let state = seed;
  return () => {
    state = (state * 48271) % 0x7fffffff;
    return state / 0x7fffffff;
  };
}

test("normalizes expressions to searchable letters", () => {
  assert.equal(normalizeWordSearchWord("Good morning!"), "GOODMORNING");
  assert.equal(normalizeWordSearchWord("café"), "CAFE");
});

test("permits only forward horizontal, vertical, and downward diagonal paths", () => {
  assert.deepEqual(getWordSearchSelectionPath({ row: 2, column: 1 }, { row: 2, column: 4 }), [
    { row: 2, column: 1 }, { row: 2, column: 2 }, { row: 2, column: 3 }, { row: 2, column: 4 },
  ]);
  assert.deepEqual(getWordSearchSelectionPath({ row: 1, column: 3 }, { row: 4, column: 3 })?.length, 4);
  assert.deepEqual(getWordSearchSelectionPath({ row: 1, column: 4 }, { row: 3, column: 2 })?.length, 3);
  assert.equal(getWordSearchSelectionPath({ row: 2, column: 4 }, { row: 2, column: 1 }), null);
  assert.equal(getWordSearchSelectionPath({ row: 4, column: 3 }, { row: 1, column: 3 }), null);
  assert.equal(getWordSearchSelectionPath({ row: 1, column: 1 }, { row: 2, column: 3 }), null);
});

test("places unique words in a complete square grid and detects their forward paths", () => {
  const puzzle = createWordSearchPuzzle([
    { id: "apple", word: "apple" },
    { id: "banana", word: "banana" },
    { id: "pear", word: "pear" },
    { id: "same-normalized", word: "APPLE!" },
  ], 10, 3, seededRandom());

  assert.equal(puzzle.letters.length, 10);
  assert.ok(puzzle.letters.every((row) => row.length === 10 && row.every((letter) => /^[A-Z]$/.test(letter))));
  assert.ok(puzzle.words.length >= 2);
  assert.equal(new Set(puzzle.words.map((word) => word.normalized)).size, puzzle.words.length);
  for (const word of puzzle.words) {
    const first = word.cells[0];
    const last = word.cells.at(-1);
    assert.equal(findWordSearchSelection(puzzle, first, last)?.id, word.id);
  }
});

test("matches word letters incrementally anywhere along an allowed forward path", () => {
  const puzzle = createWordSearchPuzzle([{ id: "apple", word: "apple" }], 10, 1, seededRandom());
  const word = puzzle.words[0];

  const alternatePath = Array.from({ length: word.normalized.length }, (_, column) => ({ row: 9, column }));
  assert.notDeepEqual(alternatePath, word.cells);
  alternatePath.forEach(({ row, column }, index) => {
    puzzle.letters[row][column] = word.normalized[index];
  });

  assert.equal(findWordSearchSelectionPrefix(puzzle, [alternatePath[0]])?.complete, false);
  assert.equal(findWordSearchSelectionPrefix(puzzle, alternatePath.slice(0, -1))?.complete, false);
  assert.equal(findWordSearchSelectionPrefix(puzzle, alternatePath)?.word.id, "apple");
  assert.equal(findWordSearchSelectionPrefix(puzzle, alternatePath)?.complete, true);
  assert.equal(findWordSearchSelectionPrefix(puzzle, [...alternatePath].reverse()), null);
  assert.equal(findWordSearchSelectionPrefix(puzzle, [alternatePath[0], alternatePath[2]]), null);
  assert.equal(findWordSearchSelectionPrefix(puzzle, alternatePath, new Set(["apple"])), null);
});
