# e2e-playwright-remote

## When to use
Use this skill to run Playwright E2E tests in Docker against a remote browser already exposed on `localhost:3000`.

## Preconditions
- Docker is installed and running.
- A remote browser is reachable at `ws://localhost:3000/chrome/playwright`.
- You are in the repository root.

## Commands
```bash
docker compose up -d --build
docker compose --profile e2e-playwright-remote run --rm --no-deps e2e-playwright-remote
```

## Optional local remote-browser container
```bash
docker compose --profile chrome run --rm -d chrome
```

## Notes
- This profile uses `network_mode: host` so the container can reach both `http://localhost:8088` and the remote browser endpoint.
- Defaults from `docker-compose.yml`:
  - `PLAYWRIGHT_WS_ENDPOINT=ws://localhost:3000/chrome/playwright`
  - `PLAYWRIGHT_BASE_URL=http://localhost:8088`
