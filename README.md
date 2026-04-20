# Agent Workflow Testing

A comprehensive bootstrap project for testing agent-driven development workflows in a modern full-stack application. This project provides a complete Go + React application with PostgreSQL database and nginx reverse proxy, designed specifically for validating automated code changes and agent interactions.

## 🏗️ Architecture

This project demonstrates a typical three-tier web application architecture:

- **`backend/`** - Go 1.25 API server (multi-module architecture with shared modules)
- **`frontend/`** - React 18.3.1 application built with Vite 7.1.11
- **`nginx/`** - nginx 1.27 reverse proxy routing `/` to frontend and `/api` to backend
- **`db/`** - PostgreSQL 16 database with persistent storage

## 🚀 Quick Start

Start the entire application stack with Docker Compose:

```bash
docker-compose up --build
```

The frontend dependencies are automatically installed inside the container using a dedicated `frontend-node-modules` volume. This approach ensures consistent dependency resolution while keeping your host filesystem clean (no `node_modules` directory on your host).

### 🌐 Access Points

Once running, you can access the application through multiple endpoints:

- **Main Application**: `http://localhost:8088` (nginx reverse proxy - recommended)
- **Backend API**: `http://localhost:8080/api/health` (direct backend access)
- **Frontend Dev Server**: `http://localhost:5173` (direct frontend access - development only)

## 🔗 API Endpoints

The backend provides a RESTful API for message management:

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| `GET` | `/api/health` | Health check endpoint | - |
| `GET` | `/api/messages` | Retrieve all messages | - |
| `POST` | `/api/messages` | Create a new message | `{ "content": "hello" }` |

Example API calls:
```bash
# Health check
curl http://localhost:8088/api/health

# Get all messages  
curl http://localhost:8088/api/messages

# Create a new message
curl -X POST http://localhost:8088/api/messages \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello from the API!"}'
```

## 🧪 End-to-End Testing

This project provides comprehensive E2E testing capabilities using multiple testing frameworks. All tests are containerized and can be run in different configurations.

### 🎭 Playwright Testing

Playwright tests use version 1.57.0 and support both local and remote browser execution.

**Local Playwright (with browser in container):**
```bash
make e2e-playwright
```

**Containerized Playwright:**
```bash
make e2e-playwright-in-docker
```

**Remote Browser Playwright (recommended for agent environments):**
```bash
# First ensure chrome browser is running on localhost:3000
make e2e-playwright-remote
```

For Docker Compose environments (no make available):
```bash
docker-compose up -d --build
docker-compose --profile e2e-playwright-remote run --rm --no-deps e2e-playwright-remote
```

Remote Playwright uses:
- `PLAYWRIGHT_WS_ENDPOINT=ws://localhost:3000/chrome/playwright`
- `PLAYWRIGHT_BASE_URL=http://localhost:8088`

### 🌲 Cypress Testing

Cypress tests use version 13.13.0 with Chrome browser support.

**Local Cypress (starts and stops stack automatically):**
```bash
make e2e-cypress
```

**Containerized Cypress:**
```bash  
make e2e-cypress-in-docker
```

The tests run against `http://nginx` within the Docker network for optimal isolation.

### 🕷️ Selenium Testing

Selenium tests use version 4.26.0 with standalone Chrome browser support.

**Local Selenium (starts and stops stack automatically):**
```bash
make e2e-selenium
```

**Remote Browser Selenium:**
```bash
make e2e-selenium-remote
```

For Docker Compose environments:
```bash
docker-compose up -d --build
docker-compose --profile e2e-selenium-remote run --rm --no-deps e2e-selenium-remote  
```

Remote Selenium configuration:
- `SELENIUM_REMOTE_URL=http://localhost:3000` (selenium standalone server)
- `SELENIUM_BASE_URL=http://localhost:8088` (application under test)

The test container uses host networking to reach both the application and the remote browser.

### 🎪 Puppeteer Testing

Puppeteer tests use core version 24.36.1 with Chrome/Chromium browser support.

**Local Puppeteer (starts and stops stack automatically):**
```bash
make e2e-puppeteer
```

**Remote Browser Puppeteer:**
```bash
make e2e-puppeteer-remote
```

For Docker Compose environments:
```bash
docker-compose up -d --build
docker-compose --profile e2e-puppeteer-remote run --rm --no-deps e2e-puppeteer-remote
```

Remote Puppeteer configuration:
- `PUPPETEER_WS_ENDPOINT=ws://localhost:3000` (chromium browser WebSocket)
- `PUPPETEER_BASE_URL=http://localhost:8088` (application under test)

Uses host networking for seamless communication between test container, application, and remote browser.

## 🤖 Agent Integration

This project is designed specifically for testing automated agent workflows. See [AGENTS.md](AGENTS.md) for detailed information about:

- Agent testing expectations and requirements
- Remote browser testing protocols
- Docker Compose commands for agent environments
- Best practices for agent-driven development

## 📚 Skills Integration

The project includes a comprehensive skills system for various automated tasks:

- **E2E Testing Skills**: Pre-configured skills for running different E2E test suites
- **Remote Browser Skills**: Specialized skills for remote browser testing scenarios
- **Agent Workflow Skills**: Tools for validating agent-generated code changes

Explore the `skills/` directory for available automation capabilities.

## 🛠️ Technology Stack

### Frontend
- **React** 18.3.1 - Modern React with hooks and concurrent features
- **Vite** 7.1.11 - Fast development server and build tool
- **Node.js** 25 - JavaScript runtime

### Backend
- **Go** 1.25 - High-performance API server
- **PostgreSQL** 16 - Reliable relational database with ACID compliance
- **pgx/v5** 5.5.5 - Fast PostgreSQL driver for Go

### Infrastructure
- **nginx** 1.27 - High-performance reverse proxy
- **Docker** - Containerization for consistent development and deployment
- **Docker Compose** - Multi-container orchestration

### Testing Tools
- **Playwright** 1.57.0 - Modern web testing framework
- **Cypress** 13.13.0 - Developer-friendly E2E testing
- **Selenium** 4.26.0 - Industry-standard web automation
- **Puppeteer** 24.36.1 - Chrome DevTools Protocol-based testing

## 🔧 Development Notes

### Volume Management
- Frontend dependencies use dedicated Docker volumes (`frontend-node-modules`) to avoid conflicts
- Each testing framework gets its own node_modules volume for isolation
- Database data persists in the `db-data` volume

### Network Configuration
- Remote browser tests use `network_mode: host` for direct communication
- nginx handles routing between frontend and backend services
- All services communicate within the Docker network for security

### Environment Variables
Key environment variables for customization:
- `PLAYWRIGHT_WS_ENDPOINT` - WebSocket endpoint for remote Playwright browser
- `SELENIUM_REMOTE_URL` - URL for remote Selenium server  
- `PUPPETEER_WS_ENDPOINT` - WebSocket endpoint for remote Puppeteer browser
- Database connection variables (DB_HOST, DB_USER, DB_PASSWORD, etc.)

## 📝 Contributing

This project serves as a testing ground for agent-driven development workflows. When contributing:

1. Always add tests for new features or bug fixes
2. Run the relevant test suites before submitting changes
3. Follow the established patterns for Docker integration
4. Consider agent workflow implications for any changes

## 📄 License

This project is designed for testing and educational purposes.
