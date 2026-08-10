# Project Description

This repository contains a full-stack bootstrap project designed for verifying agent workflows in a Go + React environment. It demonstrates a simple "Message Board" application.

## Architecture

The system consists of the following components orchestrated via Docker Compose:

- **Frontend:** A React application built with Vite. It serves the user interface for viewing and posting messages.
- **Backend:** A Go (Golang) API server using `net/http` for REST endpoints and `pgx` for PostgreSQL database interactions.
- **Database:** PostgreSQL for persistent storage of messages.
- **Reverse Proxy:** Nginx configured to route traffic to the frontend (`/`) and backend API (`/api`).

## Key Technologies

- **Go:** 1.25+
- **React:** 18.x
- **Vite:** 5.x
- **PostgreSQL:** 16.x
- **Docker & Docker Compose**

## API Endpoints

The backend exposes the following REST endpoints:

- `GET /api/health`: Health check endpoint. Returns status and app version.
- `GET /api/messages`: Retrieves a list of recent messages.
- `POST /api/messages`: Creates a new message. Payload: `{ "content": "string" }`.

## Testing

The project is equipped with multiple End-to-End (E2E) testing frameworks located in `frontend/e2e`:
- Playwright
- Cypress
- Selenium
- Puppeteer

These tests verify the application's functionality by interacting with the running stack.
