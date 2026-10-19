import assert from "node:assert/strict";
import test from "node:test";

import { createInvalidatableAsyncCache } from "./invalidatable-async-cache.mjs";

test("coalesces concurrent loads and reuses the cached value", async () => {
  const cache = createInvalidatableAsyncCache();
  let loads = 0;
  const load = async () => {
    loads += 1;
    return { value: "cached" };
  };

  const [first, second] = await Promise.all([
    cache.get("user-1", load),
    cache.get("user-1", load),
  ]);
  const third = await cache.get("user-1", load);

  assert.equal(first, second);
  assert.equal(second, third);
  assert.equal(loads, 1);
});

test("does not cache an in-flight result after invalidation", async () => {
  const cache = createInvalidatableAsyncCache();
  let resolveStale;
  let loads = 0;
  const staleRequest = cache.get("user-1", () => {
    loads += 1;
    return new Promise((resolve) => {
      resolveStale = resolve;
    });
  });

  await Promise.resolve();
  cache.invalidate("user-1");
  const freshRequest = cache.get("user-1", async () => {
    loads += 1;
    return "fresh";
  });
  resolveStale("stale");

  assert.equal(await staleRequest, "fresh");
  assert.equal(await freshRequest, "fresh");
  assert.equal(await cache.get("user-1", async () => "unexpected"), "fresh");
  assert.equal(loads, 2);
});

test("does not cache failed loads", async () => {
  const cache = createInvalidatableAsyncCache();
  const error = new Error("load failed");

  await assert.rejects(cache.get("user-1", async () => { throw error; }), error);
  assert.equal(await cache.get("user-1", async () => "recovered"), "recovered");
});
