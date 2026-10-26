import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const messageSource = await readFile(new URL("../components/ui/AutoDismissMessage.tsx", import.meta.url), "utf8");
const layoutSource = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");

test("inline success, warning, and error messages dismiss after three seconds", () => {
  assert.match(messageSource, /setTimeout\(\(\) => setVisible\(false\), 3000\)/);
  assert.match(messageSource, /success: "bg-emerald-50/);
  assert.match(messageSource, /warning: "bg-amber-50/);
  assert.match(messageSource, /error: "bg-red-50/);
});

test("toast notifications also use a three-second duration", () => {
  assert.match(layoutSource, /<Toaster[\s\S]*?duration=\{3000\}/);
});
