import { test, expect } from "@playwright/test";

test("can delete a posted message", async ({ page }) => {
  const message = `To-Delete ${Date.now()}`;

  // Create the message
  await page.goto("/");
  await page.getByPlaceholder("What should the agent verify?").fill(message);
  await page.getByRole("button", { name: "Send" }).click();

  const list = page.getByRole("list");
  await expect(list).toContainText(message, { timeout: 10_000 });

  // Click the Delete button for this message
  const listItem = page.locator("li", { hasText: message }).first();
  await expect(listItem).toBeVisible();
  await listItem.getByRole("button", { name: /delete/i }).click();

  // Verify it disappears from the list
  await expect(list).not.toContainText(message, { timeout: 10_000 });
});
