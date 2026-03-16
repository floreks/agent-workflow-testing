---
name: e2e-puppeteer-remote
description: Run Puppeteer tests in Docker against a remote browser exposed on localhost:3000.
---

# e2e-puppeteer-remote

## When to use
Use this skill to run Puppeteer tests from Docker against a remote browser exposed on `localhost:3000`.

## Preconditions
- Docker is installed and running.
- Remote browser websocket endpoint is reachable at `ws://localhost:3000`.
- You are in the repository root.

## Commands
```bash
docker compose up -d --build
docker compose --profile e2e-puppeteer-remote run --rm --no-deps e2e-puppeteer-remote
```

## Optional local remote-browser container
```bash
docker compose --profile chromium run --rm -d chromium
```

## Notes
- This profile uses `network_mode: host` for access to both app and remote browser.
- Defaults from `docker-compose.yml`:
  - `PUPPETEER_WS_ENDPOINT=ws://localhost:3000`
  - `PUPPETEER_BASE_URL=http://localhost:8088`
