import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../components/publish/PublishVocabularyContent.tsx", import.meta.url), "utf8");

test("publish lists hide active requests but retain rejected items for resubmission", () => {
  assert.match(source, /status === "pending" \|\| item\.status === "published"/);
  assert.match(source, /status === "pending" \|\| item\.status === "published"\)\.flatMap/);
  assert.match(source, /Rejected · resubmittable/);
});

test("rejected words remain requestable even if their personal vocabulary row is missing", () => {
  assert.match(source, /select\("id, owner_id, category_id, normalized_word, word, meaning, ipa, status, community_categories!inner\(name\)"\)/);
  assert.match(source, /communityWordRequests\.filter\(\(item\) => item\.status === "rejected"/);
  assert.match(source, /const requestableWords = \[\.\.\.words, \.\.\.rejectedWordFallbacks\]/);
  assert.match(source, /const word = requestableWords\.find\(\(item\) => item\.id === wordId\)/);
});

test("rejected categories remain requestable even if absent from the personal category list", () => {
  assert.match(source, /const rejectedCategoryFallbacks = communityCategoryRequests\.filter\(\(item\) => item\.owner_id && item\.status === "rejected"/);
  assert.match(source, /const requestableCategories = \[\.\.\.userCategories, \.\.\.rejectedCategoryFallbacks\]/);
  assert.match(source, /requestableCategories\.length \? requestableCategories\.map/);
});

test("resubmitting a rejected category or word resets only the owner's rejected row to pending", () => {
  assert.match(source, /update\(\{ status: "pending", image_path: categories\.find\(\(item\) => item\.name === categoryName\)\?\.image_path \?\? null \}\)\.eq\("id", found\.data\.id\)\.eq\("owner_id", user\.id\)\.eq\("status", "rejected"\)\.select\("id"\)/);
  assert.match(source, /status: "pending" \}\)\.eq\("id", previous\.data\.id\)\.eq\("owner_id", user\.id\)\.eq\("status", "rejected"\)\.select\("id"\)/);
  assert.match(source, /if \(!updated\) toast\.info\("This category is no longer available to resubmit/);
  assert.match(source, /if \(!updated\) toast\.info\("This word is no longer available to resubmit/);
});

test("selecting a category also selects its requestable words and unselecting clears them", () => {
  assert.match(source, /const categoryWordIds = userWords\.filter\(\(word\) => normalize\(word\.category\) === normalizedName\)\.map\(\(word\) => word\.id\)/);
  assert.match(source, /\[\.\.\.new Set\(\[\.\.\.current, \.\.\.categoryWordIds\]\)\]/);
  assert.match(source, /current\.filter\(\(id\) => !categoryWordIds\.includes\(id\)\)/);
});
