import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const notifications = await readFile(new URL("../components/notifications/NotificationsContent.tsx", import.meta.url), "utf8");
const sidebar = await readFile(new URL("../components/layout/Sidebar.tsx", import.meta.url), "utf8");

test("clicking an unread notification marks it read and refreshes the sidebar badge", () => {
  assert.match(notifications, /item\.read_at \? \([\s\S]*?\) : \([\s\S]*?onClick=\{\(\) => void markAsRead\(item\)\}/);
  assert.match(notifications, /\.update\(\{ read_at: readAt \}\)[\s\S]*?\.eq\("id", item\.id\)[\s\S]*?\.is\("read_at", null\)/);
  assert.match(notifications, /bluewords:notifications-updated/);
  assert.match(sidebar, /handleNotificationsUpdated[\s\S]*?refreshUnreadCount/);
});

test("unread notifications show a pointer cursor", () => {
  assert.match(notifications, /w-full cursor-pointer gap-3 text-left/);
});
