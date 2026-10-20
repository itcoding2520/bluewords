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
  assert.match(source, /showStickyStart \|\| showStickyGameAction \? "pb-24 sm:pb-0"/);
});

test("quiz setup uses a separate non-sticky start action on desktop", () => {
  assert.match(source, /mt-7 hidden justify-end sm:flex/);
  assert.match(source, /className="min-h-12 w-full"/);
});

test("quiz question type cards are compact and side-by-side on mobile", () => {
  assert.match(source, /grid grid-cols-2 gap-2 sm:hidden/);
  assert.match(source, /CompactModeButton active=\{mode === "choose-meaning"\}/);
  assert.match(source, /CompactModeButton active=\{mode === "type-word"\}/);
  assert.match(source, /hidden gap-3 sm:grid sm:grid-cols-2/);
});

test("quiz answer actions stay available at the bottom of the mobile screen", () => {
  assert.match(source, /const showStickyGameAction = tab === "play" && phase === "playing"/);
  assert.match(source, /form="quiz-type-word-answer"/);
  assert.match(source, /id="quiz-type-word-answer" onSubmit=\{handleSubmit\}/);
  assert.match(source, /className="hidden sm:inline-flex">Check/);
  assert.match(source, /className="hidden sm:inline-flex">\{questionIndex \+ 1 === questions\.length/);
});

test("quiz progress header sticks below the mobile app header while scrolling", () => {
  assert.match(source, /sticky top-25 z-20[\s\S]*?lg:top-0/);
});
