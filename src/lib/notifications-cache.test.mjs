import test from "node:test";
import assert from "node:assert/strict";
import { clearNotificationsCacheForTests, getCachedNotifications, invalidateNotificationsCache } from "./notifications-cache.mjs";

test("reuses notifications for the same account and separates accounts", async () => {
  clearNotificationsCacheForTests();
  let loads = 0;
  const loader = async (userId) => `${userId}:${++loads}`;

  assert.equal(await getCachedNotifications("user-a", () => loader("user-a")), "user-a:1");
  assert.equal(await getCachedNotifications("user-a", () => loader("user-a")), "user-a:1");
  assert.equal(await getCachedNotifications("user-b", () => loader("user-b")), "user-b:2");
});

test("refreshes notifications after an explicit invalidation", async () => {
  clearNotificationsCacheForTests();
  let loads = 0;
  const loader = async () => ++loads;

  assert.equal(await getCachedNotifications("user-a", loader), 1);
  invalidateNotificationsCache("user-a");
  assert.equal(await getCachedNotifications("user-a", loader), 2);
});

test("reuses a fresh session snapshot after a page reload", async () => {
  clearNotificationsCacheForTests();
  const values = new Map();
  globalThis.window = { sessionStorage: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  } };
  try {
    let loads = 0;
    assert.deepEqual(await getCachedNotifications("user-a", async () => { loads += 1; return [{ id: "n1" }]; }), [{ id: "n1" }]);
    clearNotificationsCacheForTests();
    assert.deepEqual(await getCachedNotifications("user-a", async () => { loads += 1; return []; }), [{ id: "n1" }]);
    assert.equal(loads, 1);
  } finally {
    delete globalThis.window;
    clearNotificationsCacheForTests();
  }
});

test("does not cache an in-flight load after invalidation", async () => {
  clearNotificationsCacheForTests();
  let finish;
  const first = getCachedNotifications("user-a", () => new Promise((resolve) => { finish = resolve; }));
  await Promise.resolve();
  invalidateNotificationsCache("user-a");
  finish(["old"]);
  await first;
  assert.deepEqual(await getCachedNotifications("user-a", async () => ["fresh"]), ["fresh"]);
});
