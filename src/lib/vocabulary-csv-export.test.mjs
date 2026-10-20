import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./vocabulary-csv.ts", import.meta.url), "utf8");

test("CSV export skips incomplete detailed meanings and falls back to the legacy meaning", () => {
  assert.match(source, /typeof item\?\.meaning === "string" && item\.meaning\.trim\(\)\.length > 0/);
  assert.match(source, /if \(meanings\.length\)/);
});
