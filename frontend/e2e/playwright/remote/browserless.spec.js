import { test as base, expect } from "@playwright/test";
import { chromium } from "playwright-core";

const wsEndpoint =
  process.env.PLAYWRIGHT_WS_ENDPOINT || "ws://localhost:3000/chrome/playwright";

const test = base.extend({
  browser: async ({}, use) => {
    const browser = await chromium.connect(wsEndpoint);
    await use(browser);
    await browser.close();
  }
});

test("homepage renders and health badge updates", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Message board" })).toBeVisible();
  const badge = page.locator(".badge");
  await expect(badge).toContainText(/ok|down/i, { timeout: 10_000 });
});

test("can post a message and see it listed", async ({ page }) => {
  const message = `Playwright ${Date.now()}`;

  await page.goto("/");
  await page.getByPlaceholder("What should the agent verify?").fill(message);
  await page.getByRole("button", { name: "Send" }).click();

  const list = page.getByRole("list");
  await expect(list).toContainText(message, { timeout: 10_000 });
});

test("can delete a message from the list", async ({ page }) => {
  const message = `To delete ${Date.now()}`;

  await page.goto("/");
  await page.getByPlaceholder("What should the agent verify?").fill(message);
  await page.getByRole("button", { name: "Send" }).click();

  // Ensure it appears
  const list = page.getByRole("list");
  await expect(list).toContainText(message, { timeout: 10_000 });

  // Find the list item containing the message and click its Remove button
  const item = page.locator("li", { hasText: message }).first();
  await expect(item).toBeVisible();
  await item.getByRole("button", { name: /^Remove/ }).click();

  // Verify it's gone
  await expect(page.getByRole("list")).not.toContainText(message);
});
