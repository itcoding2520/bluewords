
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE_URL = "https://bluewords.vercel.app";

const email = process.env.SCREENSHOT_EMAIL;
const password = process.env.SCREENSHOT_PASSWORD;

if (!email || !password) {
  throw new Error(
    "Missing SCREENSHOT_EMAIL or SCREENSHOT_PASSWORD."
  );
}

const browser = await chromium.launch();

try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  await mkdir("public/screenshots", { recursive: true });

  // 1. Open Login page
  await page.goto(`${BASE_URL}/login`);

  // 2. Sign in with the screenshot account
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);

  await page.getByRole("button", {
    name: /log in|login|sign in/i,
  }).click();

  // 3. Wait for Dashboard
  await page.waitForURL((url) => url.pathname === "/", {
    timeout: 30000,
  });

  await page.getByText("Loading dashboard...").waitFor({
    state: "hidden",
    timeout: 30000,
  });

  await page.screenshot({
    path: "public/screenshots/dashboard.png",
    fullPage: true,
  });

  // 4. Open Vocabulary page
  await page.goto(`${BASE_URL}/vocabulary`);

  await page
    .getByText("Loading vocabulary...")
    .waitFor({ state: "hidden", timeout: 30000 });

  await page.screenshot({
    path: "public/screenshots/vocabulary.png",
    fullPage: true,
  });

  console.log("Screenshots saved successfully!");
} finally {
  await browser.close();
}
