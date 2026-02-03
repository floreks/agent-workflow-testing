import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || "http://localhost:8088",
    specPattern: "e2e/cypress/**/*.cy.{js,ts}",
    supportFile: "e2e/cypress/support/e2e.js",
    video: false,
    screenshotOnRunFailure: false
  }
});
