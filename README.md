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
make e2e
```
