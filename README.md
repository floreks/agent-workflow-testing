# Agent Workflow Testing

Bootstrap project for verifying agent-driven changes in a Go + React application with PostgreSQL and an nginx dev proxy.

## Repository layout

```
.
├── backend/                    Go API server
│   ├── cmd/server/main.go      Entry point
│   └── internal/
│       ├── api/routes.go       Router wiring
│       ├── db/db.go            DB connectivity & schema
│       ├── handlers/           HTTP handler implementations
│       ├── middleware/         Logger, CORS, Recover, TraceID
│       └── models/             Domain types & request validation
├── frontend/                   React app (Vite)
│   └── src/
│       ├── components/         Header, MessageForm, MessageList
│       ├── hooks/              useMessages (reducer-based state)
│       └── utils/api.js        Fetch wrapper
├── nginx/dev.conf              Reverse proxy (/ → frontend, /api → backend)
├── shared/version/             Shared version package
└── docker-compose.yml          Full local stack
```

## Quick start

```bash
docker compose up --build
```

Frontend `node_modules` live in a named Docker volume — nothing is written to the host.

| URL | Service |
|-----|---------|
| <http://localhost:8088> | nginx proxy (recommended entry point) |
| <http://localhost:8080/api/health> | backend direct |
| <http://localhost:5173> | Vite dev server direct |

## API reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Returns status, version, and DB latency |
| `GET` | `/api/ready` | Readiness probe (alias for health) |
| `GET` | `/api/stats` | DB connection pool metrics |
| `GET` | `/api/messages?limit=N` | List recent messages (default 20, max 100) |
| `POST` | `/api/messages` | Create a message `{ "content": "...", "author": "..." }` |
| `DELETE` | `/api/messages/:id` | Delete a message by ID |

### Example requests

```bash
# Check health
curl http://localhost:8080/api/health

# Post a message
curl -X POST http://localhost:8080/api/messages \
  -H 'Content-Type: application/json' \
  -d '{"content":"Hello from curl","author":"dev"}'

# List messages
curl http://localhost:8080/api/messages?limit=5

# Delete a message
curl -X DELETE http://localhost:8080/api/messages/1
```

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `db` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USER` | `app` | PostgreSQL user |
| `DB_PASSWORD` | `app` | PostgreSQL password |
| `DB_NAME` | `app` | PostgreSQL database |
| `DB_SSLMODE` | `disable` | SSL mode |
| `APP_ADDR` | `:8080` | HTTP listen address |

Override at link time to embed a build hash:

```bash
go build -ldflags "-X agent-workflow-testing/shared/version.BuildMetadata=$(git rev-parse --short HEAD)"
```

## E2E testing

### Playwright (remote browser)

```bash
docker compose up -d --build
docker compose --profile e2e-playwright-remote run --rm --no-deps e2e-playwright-remote
```

### Playwright (headless Docker)

```bash
make e2e-playwright-in-docker
```

### Cypress

```bash
make e2e-cypress
# or inside Docker:
make e2e-cypress-in-docker
```

### Selenium (remote browser)

```bash
docker compose up -d --build
docker compose --profile e2e-selenium-remote run --rm --no-deps e2e-selenium-remote
```

### Puppeteer (remote browser)

```bash
docker compose up -d --build
docker compose --profile e2e-puppeteer-remote run --rm --no-deps e2e-puppeteer-remote
```

## Development notes

- The backend uses a **connection retry loop** (5 attempts, exponential back-off) so it tolerates PostgreSQL taking a few seconds to start.
- All JSON errors are returned as `{ "error": "...", "code": <status> }`.
- CORS is wide-open for local development — tighten before shipping.
- The frontend auto-refreshes the message list every 60 seconds.
