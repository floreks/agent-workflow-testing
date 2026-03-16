# e2e-cypress-headless-docker

## When to use
Use this skill to run Cypress E2E tests fully in Docker with a headless browser in the Cypress container.

## Preconditions
- Docker is installed and running.
- You are in the repository root.

## Commands
```bash
docker compose up -d --build
docker compose --profile cypress run --rm --no-deps cypress
```

## Notes
- The Cypress container runs `npx cypress run --config baseUrl=http://nginx`.
- This is the default containerized headless path for Cypress in this repo.
