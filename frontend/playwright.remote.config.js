import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:8088";

export default defineConfig({
  testDir: "./tests-remote",
  timeout: 30_000,
  outputDir: process.env.PLAYWRIGHT_OUTPUT_DIR || "test-results-remote",
  use: {
    baseURL,
    headless: true
  }
});
