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

test("can delete a message from the board", async ({ page }) => {
  const message = `DeleteMe ${Date.now()}`;

  await page.goto("/");
  // Create a message first
  await page.getByPlaceholder("What should the agent verify?").fill(message);
  await page.getByRole("button", { name: "Send" }).click();

  const list = page.getByRole("list");
  await expect(list).toContainText(message, { timeout: 10_000 });

  // Find the list item containing our message and click its Delete button
  const item = page.locator("li", { hasText: message });
  const deleteButton = item.getByRole("button", { name: /delete/i });
  await deleteButton.click();

  // Ensure it disappears
  await expect(list).not.toContainText(message, { timeout: 10_000 });
});
