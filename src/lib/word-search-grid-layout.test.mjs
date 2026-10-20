import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

test("word search grid always fits its container at every viewport size", () => {
  assert.match(css, /\.word-search-grid\s*\{[^}]*width:\s*100%;[^}]*max-width:\s*100%;[^}]*grid-template-columns:\s*repeat\(var\(--word-search-grid-count\),\s*minmax\(0,\s*1fr\)\)/s);
  assert.doesNotMatch(css, /\.word-search-grid\s*\{[^}]*width:\s*max-content/s);
  assert.doesNotMatch(css, /grid-template-columns:\s*repeat\(var\(--word-search-grid-count\),\s*var\(--word-search-cell-size\)\)/);
});
