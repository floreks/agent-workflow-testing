import { test } from "node:test";
import assert from "node:assert/strict";
import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";
import * as chromedriver from "chromedriver";

const baseUrl =
  process.env.SELENIUM_BASE_URL ||
  process.env.E2E_BASE_URL ||
  "http://localhost:8088";
const remoteUrl = process.env.SELENIUM_REMOTE_URL;

const createDriver = async () => {
  const options = new chrome.Options();
  options.addArguments("--headless=new", "--no-sandbox", "--disable-dev-shm-usage");
  const builder = new Builder().forBrowser("chrome").setChromeOptions(options);

  if (remoteUrl) {
    return builder.usingServer(remoteUrl).build();
  }

  const service = new chrome.ServiceBuilder(chromedriver.path);
  return builder.setChromeService(service).build();
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
      until.elementLocated(By.css('input[placeholder="What should the agent verify?"]')),
      10_000
    );
    await input.sendKeys(message);
    const button = await driver.findElement(By.css('button[type="submit"]'));
    await button.click();

    const list = await driver.findElement(By.css("ul"));
    await driver.wait(until.elementTextContains(list, message), 10_000);
  } finally {
    await driver.quit();
  }
});

test("can delete a posted message", async () => {
  const driver = await createDriver();

  try {
    const message = `ToDelete ${Date.now()}`;

    await driver.get(`${baseUrl}/`);

    // Post a new message first
    const input = await driver.wait(
      until.elementLocated(By.css('input[placeholder="What should the agent verify?"]')),
      10_000
    );
    await input.clear();
    await input.sendKeys(message);
    await (await driver.findElement(By.css('button[type="submit"]'))).click();

    // Ensure it's in the list
    const list = await driver.findElement(By.css("ul"));
    await driver.wait(until.elementTextContains(list, message), 10_000);

    // Click the delete button in the same list item as the message
    const deleteBtn = await driver.findElement(
      By.xpath(`//li[.//span[text()='${message}']]//button[normalize-space()='Delete']`)
    );
    await deleteBtn.click();

    // Wait until the message no longer appears
    await driver.wait(async () => {
      const text = await list.getText();
      return !text.includes(message);
    }, 10_000);
  } finally {
    await driver.quit();
  }
});
