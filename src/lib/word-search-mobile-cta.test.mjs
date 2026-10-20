import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../components/games/WordSearchContent.tsx", import.meta.url), "utf8");

test("word search setup keeps the mobile start action fixed above the safe area", () => {
  assert.match(source, /const showStickyStart = phase === "setup" && tab === "play"/);
  assert.match(source, /fixed inset-x-0 bottom-0[\s\S]*?pb-\[calc\(0\.75rem\+env\(safe-area-inset-bottom\)\)\][\s\S]*?sm:hidden/);
  assert.match(source, /showStickyStart \? "pb-24 sm:pb-0"/);
});

test("word search setup keeps an inline start action on desktop only", () => {
  assert.match(source, /className="hidden min-h-12 w-full sm:inline-flex sm:w-auto"/);
});

test("word search timer remains sticky while a round is in progress", () => {
  assert.match(source, /phase === "playing" \? \([\s\S]*?<div className="sticky top-25 z-20[\s\S]*?href="\/games"[\s\S]*?Back to Games[\s\S]*?formatDuration\(elapsedSeconds\)/);
});
