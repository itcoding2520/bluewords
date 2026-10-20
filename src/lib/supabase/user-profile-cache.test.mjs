import assert from "node:assert/strict";
import test from "node:test";

import {
  clearCachedUserProfile,
  getCachedUserProfile,
  setCachedUserProfile,
} from "./user-profile-cache.mjs";

test("profile cache reuses avatar data per account, including profiles without a row", () => {
  clearCachedUserProfile();
  const profile = { user_id: "user-1", nickname: "Jamie", avatar_path: "user-1/avatar.webp" };
  setCachedUserProfile("user-1", profile);
  setCachedUserProfile("user-2", null);

  assert.equal(getCachedUserProfile("user-1"), profile);
  assert.equal(getCachedUserProfile("user-2"), null);
  assert.equal(getCachedUserProfile("user-3"), undefined);
});

test("profile cache can update or clear one account without affecting others", () => {
  clearCachedUserProfile();
  setCachedUserProfile("user-1", { nickname: "Old" });
  setCachedUserProfile("user-2", { nickname: "Other" });
  setCachedUserProfile("user-1", { nickname: "New" });
  clearCachedUserProfile("user-1");

  assert.equal(getCachedUserProfile("user-1"), undefined);
  assert.deepEqual(getCachedUserProfile("user-2"), { nickname: "Other" });
});
