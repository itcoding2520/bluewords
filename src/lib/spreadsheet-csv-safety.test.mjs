import assert from "node:assert/strict";
import test from "node:test";

import {
  protectSpreadsheetCell,
  restoreSpreadsheetCell,
} from "./spreadsheet-csv-safety.mjs";

test("protects spreadsheet formula prefixes and restores them on import", () => {
  for (const value of ["=SUM(A1:A2)", "+cmd", "-1+2", "@value", "  =1+1"]) {
    assert.equal(restoreSpreadsheetCell(protectSpreadsheetCell(value)), value);
    assert.ok(protectSpreadsheetCell(value).startsWith("'"));
  }
});

test("leaves ordinary values intact", () => {
  for (const value of ["apple", "hello world", "value_1"]) {
    assert.equal(protectSpreadsheetCell(value), value);
    assert.equal(restoreSpreadsheetCell(value), value);
  }
});

test("preserves values that already begin with an apostrophe", () => {
  for (const value of ["'word", "'=1+1", "''word"]) {
    assert.equal(restoreSpreadsheetCell(protectSpreadsheetCell(value)), value);
  }
});
