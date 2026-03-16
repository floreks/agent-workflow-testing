# Local Skills for E2E Execution

This directory contains granular, framework-specific skill definitions for running E2E tests in this repository.

## Skills

- `e2e-playwright-headless-docker`: Playwright in Docker (headless browser in container).
- `e2e-playwright-remote`: Playwright in Docker against a remote browser exposed on `localhost:3000`.
- `e2e-cypress-headless-docker`: Cypress in Docker (headless browser in container).
- `e2e-selenium-remote`: Selenium test container against remote Selenium browser on `localhost:3000`.
- `e2e-puppeteer-remote`: Puppeteer test container against remote browser on `localhost:3000`.

All skills use `docker compose` directly.
