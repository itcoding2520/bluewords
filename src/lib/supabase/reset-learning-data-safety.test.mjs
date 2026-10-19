import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const resetScriptUrl = new URL(
  "../../../scripts/sql/reset-all-account-learning-data.sql",
  import.meta.url
);
const resetScript = await readFile(resetScriptUrl, "utf8");

test("all-account learning reset defaults to NO and requires explicit YES", () => {
  assert.match(
    resetScript,
    /SET LOCAL app\.confirm_reset_all_account_learning_data\s*=\s*'NO'/i
  );
  assert.match(
    resetScript,
    /current_setting\('app\.confirm_reset_all_account_learning_data',\s*true\)\s+IS DISTINCT FROM\s+'YES'/i
  );
  assert.match(resetScript, /RAISE EXCEPTION 'Reset not run\./i);
});

test("reset safety gate runs before destructive statements in one transaction", () => {
  const gateIndex = resetScript.indexOf("Safety gate:");
  const validationBlockIndex = resetScript.indexOf("IF current_setting(");
  const firstDeleteIndex = resetScript.indexOf("DELETE FROM public.vocabulary_quiz_sessions");

  assert.ok(resetScript.trimStart().startsWith("-- ONE-TIME, DESTRUCTIVE OPERATION."));
  assert.match(resetScript, /^BEGIN;/m);
  assert.match(resetScript, /^COMMIT;/m);
  assert.ok(gateIndex >= 0 && gateIndex < validationBlockIndex);
  assert.ok(validationBlockIndex >= 0 && validationBlockIndex < firstDeleteIndex);
});
