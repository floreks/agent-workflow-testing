## Agents

### Testing expectations
- Always add tests for any code changes, new features, or bug fixes.
- Always run the relevant test suites locally before reporting completion.
- If tests cannot be run, explain why and propose the closest alternative.

### Remote browser testing (localhost:3000)
This repo provides Docker-based E2E targets that assume the browser is already exposed on `localhost:3000`.
Prefer running against the remote browser instead of running full tests in Docker with local browsers.
Always use the Docker targets with host networking so the test container can reach both the app and the remote browser.

#### Playwright (remote browser)
- Use Docker Compose directly (no `make` in this environment):
```bash
docker compose up -d --build
docker compose --profile e2e-playwright-remote run --rm e2e-playwright-remote
```
- It uses `PLAYWRIGHT_WS_ENDPOINT=ws://localhost:3000/chrome/playwright` and `PLAYWRIGHT_BASE_URL=http://localhost:8088` from `docker-compose.yml`.

#### Selenium (remote browser)
- Use Docker Compose directly (no `make` in this environment):
```bash
docker compose up -d --build
docker compose --profile e2e-selenium-remote run --rm e2e-selenium-remote
```
- It uses `SELENIUM_REMOTE_URL=http://localhost:3000` and `SELENIUM_BASE_URL=http://localhost:8088` from `docker-compose.yml`.

If you must override endpoints, do so via environment variables or `docker-compose.yml`, but keep `network_mode: host` for the remote-browser test containers.
