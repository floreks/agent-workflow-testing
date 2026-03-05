# Agent Workflow Testing

Bootstrap project for verifying changes in a Go + React app with Postgres and an nginx dev proxy.

[![Go](https://img.shields.io/badge/Go-1.22+-00ADD8?style=flat&logo=go)](https://go.dev/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat&logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6+-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Development](#development)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Contributing](#contributing)

## ✨ Features

- **Full-stack application** with Go backend and React frontend
- **Multi-module Go workspace** with shared packages
- **PostgreSQL database** integration
- **Nginx reverse proxy** for unified dev environment
- **Hot-reload development** with Vite for frontend
- **Comprehensive E2E testing** support (Playwright, Cypress, Selenium, Puppeteer)
- **Docker Compose** for easy setup and deployment
- **Remote browser testing** capability

## 🏗 Architecture

```
┌─────────────┐
│   nginx     │  :8088 (reverse proxy)
│  (port 80)  │
└──────┬──────┘
       │
       ├─────────────┐
       │             │
   ┌───▼───┐    ┌───▼──────┐
   │React  │    │Go API    │
   │Vite   │    │Server    │
   │:5173  │    │:8080     │
   └───────┘    └────┬─────┘
                     │
                ┌────▼──────┐
                │PostgreSQL │
                │:5432      │
                └───────────┘
```

### Technology Stack

- **Backend**: Go 1.22+ with Gorilla Mux
- **Frontend**: React 18+ with Vite 6+
- **Database**: PostgreSQL 16
- **Proxy**: Nginx 1.27
- **Testing**: Playwright, Cypress, Selenium, Puppeteer
- **Containerization**: Docker & Docker Compose

## 📦 Prerequisites

- **Docker** 20.10+ and **Docker Compose** 2.0+
- **Make** (optional, for convenience targets)
- **Git**

For local development without Docker:
- **Go** 1.22+
- **Node.js** 20+
- **PostgreSQL** 16+

## 🚀 Quick Start

### Using Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd agent-workflow-testing
   ```

2. **Start all services**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend (via nginx): http://localhost:8088
   - Backend API: http://localhost:8080/api/health
   - Frontend (direct): http://localhost:5173

4. **Stop services**
   ```bash
   docker-compose down
   ```

## 📁 Project Structure

```
.
├── backend/              # Go API server
│   ├── cmd/             # Application entry points
│   ├── internal/        # Private application code
│   ├── Dockerfile       # Backend container definition
│   └── go.mod           # Go module dependencies
├── frontend/            # React application
│   ├── src/            # React source code
│   ├── e2e/            # End-to-end tests
│   │   ├── playwright/ # Playwright tests
│   │   ├── cypress/    # Cypress tests
│   │   ├── selenium/   # Selenium tests
│   │   └── puppeteer/  # Puppeteer tests
│   ├── package.json    # Node dependencies
│   └── Dockerfile      # Frontend container definition
├── shared/             # Shared Go packages
│   └── version/        # Version information
├── nginx/              # Nginx configuration
│   └── dev.conf        # Development proxy config
├── docker-compose.yml  # Container orchestration
├── go.work            # Go workspace configuration
└── Makefile           # Build and test targets
```

## 💻 Development

### Starting the Development Environment

```bash
docker-compose up --build
```

This command will:
- Build all container images
- Start PostgreSQL database
- Start Go backend with hot-reload
- Start React frontend with Vite dev server
- Start nginx reverse proxy

### Frontend Development

The frontend uses Vite for fast hot-module replacement (HMR). Changes to files in `frontend/src/` are automatically reflected in the browser.

Frontend dependencies are managed in a Docker volume (`frontend-node-modules`), so you won't see `node_modules` on your host machine.

### Backend Development

The backend is a Go application with live code mounting. Changes trigger automatic restarts through Docker Compose volume mounts.

### Database

PostgreSQL runs on port `5432` with:
- **User**: `app`
- **Password**: `app`
- **Database**: `app`

Data persists in the `db-data` Docker volume.

## 📡 API Documentation

### Endpoints

#### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok"
}
```

#### Get Messages
```http
GET /api/messages
```

**Response:**
```json
[
  {
    "id": 1,
    "content": "Hello World",
    "created_at": "2026-03-05T12:00:00Z"
  }
]
```

#### Create Message
```http
POST /api/messages
Content-Type: application/json

{
  "content": "hello"
}
```

**Response:**
```json
{
  "id": 2,
  "content": "hello",
  "created_at": "2026-03-05T12:05:00Z"
}
```

## 🧪 Testing

This project includes comprehensive end-to-end testing support with multiple frameworks.

### Playwright Tests

#### Standard (with local browser)
```bash
make e2e-playwright
```

#### Docker-based
```bash
make e2e-playwright-in-docker
```

#### Remote browser (localhost:3000)
```bash
docker compose up -d --build
docker compose --profile e2e-playwright-remote run --rm --no-deps e2e-playwright-remote
```

Uses `PLAYWRIGHT_WS_ENDPOINT=ws://localhost:3000/chrome/playwright`

### Cypress Tests

#### Standard
```bash
make e2e-cypress
```

#### Docker-based
```bash
make e2e-cypress-in-docker
```

### Selenium Tests

#### Standard
```bash
make e2e-selenium
```

#### Remote browser (localhost:3000)
```bash
docker compose up -d --build
docker compose --profile e2e-selenium-remote run --rm --no-deps e2e-selenium-remote
```

Uses `SELENIUM_REMOTE_URL=http://localhost:3000`

### Puppeteer Tests

#### Standard
```bash
make e2e-puppeteer
```

#### Remote browser (localhost:3000)
```bash
docker compose up -d --build
docker compose --profile e2e-puppeteer-remote run --rm --no-deps e2e-puppeteer-remote
```

Uses `PUPPETEER_WS_ENDPOINT=ws://localhost:3000`

### Remote Browser Testing

The project supports remote browser testing, which is useful for:
- Testing in containerized environments
- Using external browser services
- Debugging with persistent browser sessions

Remote browser endpoints default to `localhost:3000` but can be overridden via environment variables.

## 🤝 Contributing

### Code Style

- **Go**: Follow standard Go conventions (`gofmt`, `golint`)
- **JavaScript/React**: ESLint configuration in `frontend/`
- **Commits**: Use clear, descriptive commit messages

### Adding Tests

When adding new features or fixing bugs:
1. Add or update relevant E2E tests
2. Ensure all test suites pass
3. Document any new testing requirements

### Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is intended as a testing bootstrap and reference implementation.

## 🔧 Troubleshooting

### Port conflicts
If ports 5432, 8080, 8088, or 5173 are already in use, modify the port mappings in `docker-compose.yml`.

### Database connection issues
Ensure PostgreSQL is healthy before backend starts:
```bash
docker-compose logs db
```

### Frontend not updating
If hot-reload isn't working, try:
```bash
docker-compose restart frontend
```

### Clean slate
To reset everything including volumes:
```bash
docker-compose down -v
docker-compose up --build
```

---

**Need help?** Check the [AGENTS.md](./AGENTS.md) file for agent-specific testing guidelines.
