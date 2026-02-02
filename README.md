# Agent Workflow Testing

Bootstrap project for verifying changes in a Go + React app with Postgres and an nginx dev proxy.

## Layout

- `backend/` Go API server (multi-module with `shared/`).
- `frontend/` React app (Vite).
- `nginx/` reverse proxy for `/` (frontend) and `/api` (backend).

## Dev workflow

```bash
docker-compose up --build
```

Frontend dependencies are installed inside the container with a dedicated `frontend-node-modules` volume, and the compose file only bind-mounts the frontend sources/config, so `node_modules` is not created on the host.

Visit:

- `http://localhost:8088` (nginx proxy)
- `http://localhost:8080/api/health` (backend direct)
- `http://localhost:5173` (frontend direct)

## API

- `GET /api/health`
- `GET /api/messages`
- `POST /api/messages` `{ "content": "hello" }`

## Playwright

Run end-to-end tests with the app started:

```bash
make e2e-playwright
```

Run Playwright inside Docker:

```bash
make e2e-playwright-in-docker
```

## Cypress

This target starts the stack and stops it afterward:

```bash
make e2e-cypress
```

Run Cypress inside Docker:

```bash
make e2e-cypress-in-docker
```

## Selenium

This target starts the stack and stops it afterward:

```bash
make e2e-selenium
```

To run Selenium against a browserless/chrome container via Docker Compose:

```bash
make e2e-selenium-remote
```

This target sets `SELENIUM_BASE_URL` to `http://nginx` so the remote browser in docker can reach the app in docker. Override if needed.

Override endpoints as needed:

- `SELENIUM_REMOTE_URL` (defaults to `http://localhost:3000/webdriver`)
