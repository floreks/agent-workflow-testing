# e2e-playwright-headless-docker

## When to use
Use this skill to run Playwright E2E tests fully in Docker with the browser running headlessly inside the Playwright container.

## Preconditions
- Docker is installed and running.
- You are in the repository root.

## Commands
```bash
docker compose up -d --build
docker compose --profile playwright run --rm --no-deps playwright
```

## Notes
- `PLAYWRIGHT_BASE_URL` is set to `http://nginx` in `docker-compose.yml` for this profile.
- This is the default containerized headless path for Playwright.
