import { test, expect } from "@playwright/test";

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
  const message = `Delete test ${Date.now()}`;

  await page.goto("/");

  // Post a new message
  await page.getByPlaceholder("What should the agent verify?").fill(message);
  await page.getByRole("button", { name: "Send" }).click();

  // Wait for the message to appear
  const list = page.getByRole("list");
  await expect(list).toContainText(message, { timeout: 10_000 });

  // Click the delete button for the message
  const deleteButton = page.getByRole("button", { name: new RegExp(`Delete message: ${message}`, "i") });
  await deleteButton.click();

  // Verify the message is no longer in the list
  await expect(list).not.toContainText(message, { timeout: 10_000 });
});
