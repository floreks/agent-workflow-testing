import { test } from "node:test";
import assert from "node:assert/strict";
import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";

const baseUrl = process.env.SELENIUM_BASE_URL || "http://localhost:8088";
const remoteUrl = process.env.SELENIUM_REMOTE_URL;

const createDriver = async () => {
  const options = new chrome.Options();
  options.addArguments("--headless=new", "--no-sandbox", "--disable-dev-shm-usage");
  const builder = new Builder().forBrowser("chrome").setChromeOptions(options);

  return builder.usingServer(remoteUrl).build();
};

test("homepage renders and health badge updates", async () => {
  const driver = await createDriver();

  try {
    await driver.get(`${baseUrl}/`);

    const heading = await driver.wait(
      until.elementLocated(By.css("h1")),
      10_000
    );
    const headingText = await heading.getText();
    assert.equal(headingText, "Message board");

    const badge = await driver.findElement(By.css(".badge"));
    await driver.wait(async () => {
      const text = await badge.getText();
      return /ok|down/i.test(text);
    }, 10_000);
  } finally {
    await driver.quit();
  }
});

test("can post a message and see it listed", async () => {
  const driver = await createDriver();

  try {
    const message = `Selenium ${Date.now()}`;

    await driver.get(`${baseUrl}/`);
    const input = await driver.wait(
      until.elementLocated(By.css("input[placeholder=\"What should the agent verify?\"]")),
      10_000
    );
    await input.sendKeys(message);
    const button = await driver.findElement(By.css("button[type=\"submit\"]"));
    await button.click();

    const list = await driver.findElement(By.css("ul"));
    await driver.wait(until.elementTextContains(list, message), 10_000);
  } finally {
    await driver.quit();
  }
});

test("can delete a message from the board", async () => {
  const driver = await createDriver();

  try {
    const message = `Delete test ${Date.now()}`;

    await driver.get(`${baseUrl}/`);

    // Post a new message
    const input = await driver.wait(
      until.elementLocated(By.css("input[placeholder=\"What should the agent verify?\"]")),
      10_000
    );
    await input.sendKeys(message);
    const submitButton = await driver.findElement(By.css("button[type=\"submit\"]"));
    await submitButton.click();

    // Wait for the message to appear
    const list = await driver.findElement(By.css("ul"));
    await driver.wait(until.elementTextContains(list, message), 10_000);

    // Find and click the delete button for this message
    const deleteButton = await driver.wait(
      until.elementLocated(By.css(".delete-btn")),
      10_000
    );
    await deleteButton.click();

    // Wait for the message to be removed from the list
    await driver.wait(async () => {
      const listText = await list.getText();
      return !listText.includes(message);
    }, 10_000);

    // Verify the message is no longer in the list
    const listText = await list.getText();
    assert.ok(!listText.includes(message), "Message should be removed from the list");
  } finally {
    await driver.quit();
  }
});

test("delete button has correct aria-label", async () => {
  const driver = await createDriver();

  try {
    const message = `Aria test ${Date.now()}`;

    await driver.get(`${baseUrl}/`);

    // Post a new message
    const input = await driver.wait(
      until.elementLocated(By.css("input[placeholder=\"What should the agent verify?\"]")),
      10_000
    );
    await input.sendKeys(message);
    const submitButton = await driver.findElement(By.css("button[type=\"submit\"]"));
    await submitButton.click();

    // Wait for the message to appear
    const list = await driver.findElement(By.css("ul"));
    await driver.wait(until.elementTextContains(list, message), 10_000);

    // Check the delete button has correct aria-label
    const deleteButton = await driver.wait(
      until.elementLocated(By.css(".delete-btn")),
      10_000
    );
    const ariaLabel = await deleteButton.getAttribute("aria-label");
    assert.ok(ariaLabel.includes(message), "aria-label should include the message content");
    assert.ok(ariaLabel.includes("Delete"), "aria-label should include 'Delete'");
  } finally {
    await driver.quit();
  }
});

test("can delete multiple messages sequentially", async () => {
  const driver = await createDriver();

  try {
    const timestamp = Date.now();
    const message1 = `Multi delete 1 ${timestamp}`;
    const message2 = `Multi delete 2 ${timestamp}`;

    await driver.get(`${baseUrl}/`);

    // Post first message
    const input = await driver.wait(
      until.elementLocated(By.css("input[placeholder=\"What should the agent verify?\"]")),
      10_000
    );
    await input.sendKeys(message1);
    let submitButton = await driver.findElement(By.css("button[type=\"submit\"]"));
    await submitButton.click();

    // Wait for first message to appear
    const list = await driver.findElement(By.css("ul"));
    await driver.wait(until.elementTextContains(list, message1), 10_000);

    // Post second message
    await input.clear();
    await input.sendKeys(message2);
    submitButton = await driver.findElement(By.css("button[type=\"submit\"]"));
    await submitButton.click();

    // Wait for second message to appear
    await driver.wait(until.elementTextContains(list, message2), 10_000);

    // Delete first message (it should be second in the list due to DESC order)
    const deleteButtons = await driver.findElements(By.css(".delete-btn"));
    assert.ok(deleteButtons.length >= 2, "Should have at least 2 delete buttons");
    await deleteButtons[1].click();

    // Wait for first message to be removed
    await driver.wait(async () => {
      const listText = await list.getText();
      return !listText.includes(message1);
    }, 10_000);

    // Verify first message is gone but second remains
    let listText = await list.getText();
    assert.ok(!listText.includes(message1), "First message should be removed");
    assert.ok(listText.includes(message2), "Second message should still be present");

    // Delete second message
    const remainingDeleteButtons = await driver.findElements(By.css(".delete-btn"));
    await remainingDeleteButtons[0].click();

    // Wait for second message to be removed
    await driver.wait(async () => {
      const listText = await list.getText();
      return !listText.includes(message2);
    }, 10_000);

    // Verify second message is also gone
    listText = await list.getText();
    assert.ok(!listText.includes(message2), "Second message should be removed");
  } finally {
    await driver.quit();
  }
});
