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

test("can delete a message", async () => {
  const driver = await createDriver();

  try {
    const message = `Delete test ${Date.now()}`;

    await driver.get(`${baseUrl}/`);

    // Post a message
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

    // Find and click the delete button
    const deleteButton = await driver.wait(
      until.elementLocated(By.css(".delete-btn")),
      10_000
    );
    await deleteButton.click();

    // Wait for the message to be removed
    await driver.wait(async () => {
      const listText = await list.getText();
      return !listText.includes(message);
    }, 10_000);
  } finally {
    await driver.quit();
  }
});

test("delete button has correct aria-label", async () => {
  const driver = await createDriver();

  try {
    const message = `Accessibility ${Date.now()}`;

    await driver.get(`${baseUrl}/`);

    // Post a message
    const input = await driver.wait(
      until.elementLocated(By.css("input[placeholder=\"What should the agent verify?\"]")),
      10_000
    );
    await input.sendKeys(message);
    const submitButton = await driver.findElement(By.css("button[type=\"submit\"]"));
    await submitButton.click();

    // Wait for the message to appear and verify aria-label
    await driver.wait(
      until.elementLocated(By.css(".delete-btn")),
      10_000
    );
    const deleteButton = await driver.findElement(By.css(".delete-btn"));
    const ariaLabel = await deleteButton.getAttribute("aria-label");
    assert.equal(ariaLabel, `Delete message: ${message}`);
  } finally {
    await driver.quit();
  }
});

test("can delete multiple messages", async () => {
  const driver = await createDriver();

  try {
    const timestamp = Date.now();
    const message1 = `Multi-delete test 1 ${timestamp}`;
    const message2 = `Multi-delete test 2 ${timestamp}`;

    await driver.get(`${baseUrl}/`);

    // Post first message
    let input = await driver.wait(
      until.elementLocated(By.css("input[placeholder=\"What should the agent verify?\"]")),
      10_000
    );
    await input.sendKeys(message1);
    let submitButton = await driver.findElement(By.css("button[type=\"submit\"]"));
    await submitButton.click();

    const list = await driver.findElement(By.css("ul"));
    await driver.wait(until.elementTextContains(list, message1), 10_000);

    // Post second message - find input again after form submission
    input = await driver.findElement(By.css("input[placeholder=\"What should the agent verify?\"]"));
    await input.clear();
    await input.sendKeys(message2);
    submitButton = await driver.findElement(By.css("button[type=\"submit\"]"));
    await submitButton.click();

    // Wait for both messages to appear
    await driver.wait(async () => {
      const listText = await list.getText();
      return listText.includes(message1) && listText.includes(message2);
    }, 10_000);

    // Delete first message (most recent is displayed first, so delete the top one)
    await driver.wait(
      until.elementLocated(By.css(".delete-btn")),
      10_000
    );

    // Get fresh reference to delete buttons
    let deleteButtons = await driver.findElements(By.css(".delete-btn"));
    assert.ok(deleteButtons.length >= 2, "Should have at least 2 delete buttons");

    await deleteButtons[0].click();

    // Wait for one message to be removed
    await driver.wait(async () => {
      const buttons = await driver.findElements(By.css(".delete-btn"));
      return buttons.length < deleteButtons.length;
    }, 10_000);

    // Verify one message still exists
    const finalButtons = await driver.findElements(By.css(".delete-btn"));
    assert.ok(finalButtons.length >= 1, "Should have at least 1 delete button remaining");
  } finally {
    await driver.quit();
  }
});
