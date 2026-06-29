import assert from "node:assert/strict";
import test from "node:test";
import puppeteer from "puppeteer-core";

const browserWSEndpoint = process.env.PUPPETEER_WS_ENDPOINT || "ws://127.0.0.1:3000";
const baseUrl = process.env.PUPPETEER_BASE_URL || "http://127.0.0.1:8088";

test("count to 1234 is rendered", async () => {
  const browser = await puppeteer.connect({ browserWSEndpoint });
  const page = await browser.newPage();

  try {
    await page.goto(baseUrl, { waitUntil: "networkidle0" });

    const countText = await page.getByLabel("Count to 1234").evaluate((el) => el.textContent);

    assert.ok(countText.startsWith("1, 2, 3"));
    assert.ok(countText.includes("1232, 1233, 1234"));

    const values = countText.split(", ");
    assert.equal(values.length, 1234);
    assert.equal(values[0], "1");
    assert.equal(values.at(-1), "1234");
  } finally {
    await page.close();
    await browser.close();
  }
});
