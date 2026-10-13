
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const browser = await chromium.launch();

const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});

await mkdir("public/screenshots", { recursive: true });

await page.goto("https://bluewords.vercel.app/", {
  waitUntil: "networkidle",
});

await page.screenshot({
  path: "public/screenshots/dashboard.png",
  fullPage: true,
});

await page.goto("https://bluewords.vercel.app/vocabulary", {
  waitUntil: "networkidle",
});

await page.screenshot({
  path: "public/screenshots/vocabulary.png",
  fullPage: true,
});

await browser.close();

console.log("Screenshots saved successfully!");
