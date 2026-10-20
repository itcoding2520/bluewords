import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./vocabulary-csv.ts", import.meta.url), "utf8");

test("CSV export skips incomplete detailed meanings and falls back to the legacy meaning", () => {
  assert.match(source, /typeof item\?\.meaning === "string" && item\.meaning\.trim\(\)\.length > 0/);
  assert.match(source, /if \(meanings\.length\)/);
});

test("CSV export has separate primary and part-of-speech meaning columns", () => {
  assert.match(source, /"meaning",\s*"part_of_speech",\s*"detailed_meaning"/);
  assert.match(source, /word\.meaning,\s*typeof item\.partOfSpeech === "string" \? item\.partOfSpeech : "",\s*item\.meaning/);
});

test("CSV import retains main meaning and accepts legacy detail rows", () => {
  assert.match(source, /const REQUIRED_CSV_HEADERS = \["word", "type", "meaning", "category", "status"\]/);
  assert.match(source, /columnIndex\.has\("detailed_meaning"\)[\s\S]*?partOfSpeechValue\s*\?\s*meaning/);
  assert.match(source, /meaning: group\.meaning/);
});
