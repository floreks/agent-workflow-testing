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

Visit:

- `http://localhost:8088` (nginx proxy)
- `http://localhost:8080/api/health` (backend direct)
- `http://localhost:5173` (frontend direct)

## API

- `GET /api/health`
- `GET /api/messages`
- `POST /api/messages` `{ "content": "hello" }`
