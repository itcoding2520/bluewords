import test from "node:test";
import assert from "node:assert/strict";
import { clearAdminDataCacheForTests, getAdminCachedData, invalidateAdminDataCache } from "./admin-data-cache.mjs";

test("reuses recent admin data and loads it again after expiry", async () => {
  clearAdminDataCacheForTests();
  let loads = 0;
  const loader = async () => ++loads;

  assert.equal(await getAdminCachedData("users", loader, { ttlMs: 10 }), 1);
  assert.equal(await getAdminCachedData("users", loader, { ttlMs: 10 }), 1);
  await new Promise((resolve) => setTimeout(resolve, 15));
  assert.equal(await getAdminCachedData("users", loader, { ttlMs: 10 }), 2);
});

test("force refresh and invalidation fetch fresh admin data", async () => {
  clearAdminDataCacheForTests();
  let loads = 0;
  const loader = async () => ++loads;

  assert.equal(await getAdminCachedData("requests", loader), 1);
  assert.equal(await getAdminCachedData("requests", loader, { force: true }), 2);
  invalidateAdminDataCache();
  assert.equal(await getAdminCachedData("requests", loader), 3);
});

test("deduplicates concurrent loads", async () => {
  clearAdminDataCacheForTests();
  let loads = 0;
  let finish;
  const loader = () => {
    loads += 1;
    return new Promise((resolve) => { finish = resolve; });
  };

  const first = getAdminCachedData("categories", loader);
  const second = getAdminCachedData("categories", loader);
  await Promise.resolve();
  finish("loaded");
  assert.deepEqual(await Promise.all([first, second]), ["loaded", "loaded"]);
  assert.equal(loads, 1);
});
