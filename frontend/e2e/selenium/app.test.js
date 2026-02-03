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

test("can delete a message from the list", async () => {
  const driver = await createDriver();

  try {
    const message = `Delete test ${Date.now()}`;

    // Navigate to app
    await driver.get(`${baseUrl}/`);

    // Post a new message
    const input = await driver.wait(
      until.elementLocated(By.css("input[placeholder=\"What should the agent verify?\"]")),
      10_000
    );
    await input.sendKeys(message);
    const submitButton = await driver.findElement(By.css("button[type=\"submit\"]"));
    await submitButton.click();

    // Wait for message to appear in list
    const list = await driver.findElement(By.css("ul"));
    await driver.wait(until.elementTextContains(list, message), 10_000);

    // Find and click the delete button for our message
    const messageItems = await driver.findElements(By.css("li.message-item"));
    let deleteButton = null;

    for (const item of messageItems) {
      const text = await item.getText();
      if (text.includes(message)) {
        deleteButton = await item.findElement(By.css(".delete-btn"));
        break;
      }
    }

    assert(deleteButton, "Delete button not found for the posted message");
    await deleteButton.click();

    // Wait for message to be removed from the DOM
    await driver.wait(async () => {
      const items = await driver.findElements(By.css("li.message-item"));
      for (const item of items) {
        const text = await item.getText();
        if (text.includes(message)) {
          return false;
        }
      }
      return true;
    }, 10_000);

    // Verify message is no longer in the list
    const updatedItems = await driver.findElements(By.css("li.message-item"));
    for (const item of updatedItems) {
      const text = await item.getText();
      assert(!text.includes(message), `Message "${message}" should be deleted but is still present`);
    }
  } finally {
    await driver.quit();
  }
});
