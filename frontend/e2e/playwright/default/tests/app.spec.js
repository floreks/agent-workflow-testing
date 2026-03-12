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

test("can delete a message", async ({ page }) => {
  const message = `Delete test ${Date.now()}`;

  await page.goto("/");

  // Post a message
  await page.getByPlaceholder("What should the agent verify?").fill(message);
  await page.getByRole("button", { name: "Send" }).click();

  const list = page.getByRole("list");
  await expect(list).toContainText(message, { timeout: 10_000 });

  // Find and click the delete button for this message
  const messageItem = page.locator("li").filter({ hasText: message });
  await expect(messageItem).toBeVisible();

  // Handle the confirmation dialog and delete
  page.on("dialog", async (dialog) => {
    expect(dialog.message()).toContain("Are you sure you want to delete this message?");
    await dialog.accept();
  });

  await messageItem.getByRole("button", { name: "Delete message" }).click();

  // Verify the message is no longer in the list
  await expect(list).not.toContainText(message, { timeout: 10_000 });
});
