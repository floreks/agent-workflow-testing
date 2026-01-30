import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:8088";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  outputDir: process.env.PLAYWRIGHT_OUTPUT_DIR || "test-results",
  use: {
    baseURL,
    headless: true
  },
  projects: [
    /* Test against desktop browsers */
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] }
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] }
    },
    /* Test against mobile viewports. */
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] }
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] }
    },
    /* Test against branded browsers. */
    {
      name: "Google Chrome",
      use: { ...devices["Desktop Chrome"], channel: "chrome" } // or 'chrome-beta'
    },
    {
      name: "Microsoft Edge",
      use: { ...devices["Desktop Edge"], channel: "msedge" } // or 'msedge-dev'
    }
  ]
});
