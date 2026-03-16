---
name: e2e-selenium-remote
description: Run Selenium tests in Docker against a remote Selenium browser exposed on localhost:3000.
---

# e2e-selenium-remote

## When to use
Use this skill to run Selenium tests from Docker against a remote Selenium browser exposed on `localhost:3000`.

## Preconditions
- Docker is installed and running.
- Selenium remote endpoint is reachable at `http://localhost:3000`.
- You are in the repository root.

## Commands
```bash
docker compose up -d --build
docker compose --profile e2e-selenium-remote run --rm --no-deps e2e-selenium-remote
```

## Optional local remote-browser container
```bash
docker compose --profile selenium-browser run --rm -d selenium-browser
```

## Notes
- This profile uses `network_mode: host` for access to both app and remote Selenium.
- Defaults from `docker-compose.yml`:
  - `SELENIUM_REMOTE_URL=http://localhost:3000`
  - `SELENIUM_BASE_URL=http://localhost:8088`
