import { test } from "node:test";
import assert from "node:assert/strict";
import puppeteer from "puppeteer-core";

const baseUrl = process.env.PUPPETEER_BASE_URL || "http://localhost:8088";
const wsEndpoint = process.env.PUPPETEER_WS_ENDPOINT;

const createBrowser = async () => {
  return puppeteer.connect({ browserWSEndpoint: wsEndpoint });
};

test("homepage renders and health badge updates", async () => {
  const browser = await createBrowser();
  const page = await browser.newPage();

  try {
    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });

    const heading = await page.waitForSelector("h1", { timeout: 10_000 });
    const headingText = await heading.evaluate((node) => node.textContent || "");
    assert.equal(headingText.trim(), "Message board");

    await page.waitForFunction(() => {
      const badge = document.querySelector(".badge");
      if (!badge) return false;
      return /ok|down/i.test(badge.textContent || "");
    }, { timeout: 10_000 });
  } finally {
    await page.close();
    await browser.close();
  }
});

test("can post a message and see it listed", async () => {
  const browser = await createBrowser();
  const page = await browser.newPage();

  try {
    const message = `Puppeteer ${Date.now()}`;

    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("input[placeholder=\"What should the agent verify?\"]", {
      timeout: 10_000
    });
    await page.type("input[placeholder=\"What should the agent verify?\"]", message);
    await page.click("button[type=\"submit\"]");

    await page.waitForFunction(
      (text) => {
        const list = document.querySelector("ul");
        return list && list.textContent && list.textContent.includes(text);
      },
      { timeout: 10_000 },
      message
    );
  } finally {
    await page.close();
    await browser.close();
  }
});

test("can delete a message", async () => {
  const browser = await createBrowser();
  const page = await browser.newPage();

  try {
    const message = `Puppeteer delete ${Date.now()}`;

    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("input[placeholder=\"What should the agent verify?\"]", {
      timeout: 10_000
    });
    await page.type("input[placeholder=\"What should the agent verify?\"]", message);
    await page.click("button[type=\"submit\"]");

    await page.waitForFunction(
      (text) => {
        const list = document.querySelector("ul");
        return list && list.textContent && list.textContent.includes(text);
      },
      { timeout: 10_000 },
      message
    );

    await page.evaluate((text) => {
      const items = Array.from(document.querySelectorAll("li"));
      const item = items.find((node) => (node.textContent || "").includes(text));
      if (!item) throw new Error("message not found");
      const button = Array.from(item.querySelectorAll("button")).find(
        (b) => (b.textContent || "").trim() === "Delete"
      );
      if (!button) throw new Error("delete button not found");
      button.click();
    }, message);

    await page.waitForFunction(
      (text) => {
        const list = document.querySelector("ul");
        return list && (!list.textContent || !list.textContent.includes(text));
      },
      { timeout: 10_000 },
      message
    );
  } finally {
    await page.close();
    await browser.close();
  }
});
