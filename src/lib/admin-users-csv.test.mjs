import assert from "node:assert/strict";
import test from "node:test";
import { exportAdminUsersCsv } from "./admin-users-csv.mjs";

test("exports safe user fields without passwords", () => {
  const csv = exportAdminUsersCsv([{ email: "=SUM(A1:A2)", nickname: "Member", created_at: "2026-10-25", last_sign_in_at: null, password: "secret" }]);
  assert.match(csv, /'=SUM\(A1:A2\)/);
  assert.doesNotMatch(csv, /secret/);
});
