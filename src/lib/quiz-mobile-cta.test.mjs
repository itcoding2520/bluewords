import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../components/quiz/QuizGameContent.tsx", import.meta.url),
  "utf8"
);

test("quiz setup keeps a mobile start action fixed above the safe area", () => {
  assert.match(source, /const showStickyStart = tab === "play" && phase === "setup"/);
  assert.match(source, /fixed inset-x-0 bottom-0[\s\S]*?pb-\[calc\(0\.75rem\+env\(safe-area-inset-bottom\)\)\][\s\S]*?sm:hidden/);
  assert.match(source, /showStickyStart \? "pb-24 sm:pb-0"/);
});

test("quiz setup uses a separate non-sticky start action on desktop", () => {
  assert.match(source, /mt-7 hidden justify-end sm:flex/);
  assert.match(source, /className="min-h-12 w-full"/);
});
