SHELL := /bin/bash

ROOT_DIR := $(abspath $(CURDIR))
COMPOSE ?= docker compose
BASE_URL ?= http://localhost:8088
PLAYWRIGHT_BASE_URL ?= http://nginx
HEALTH_URL := $(BASE_URL)/api/health

.PHONY: up down wait e2e-playwright e2e-playwright-in-docker e2e-cypress e2e-cypress-in-docker e2e-selenium e2e-selenium-in-docker e2e-selenium-remote

up:
	$(COMPOSE) up -d --build

down:
	$(COMPOSE) down -v

wait:
	@for i in {1..30}; do \
		if curl -fsS "$(HEALTH_URL)" > /dev/null && curl -fsS "$(BASE_URL)/" > /dev/null; then \
			exit 0; \
		fi; \
		sleep 1; \
	done; \
	echo "Timed out waiting for $(HEALTH_URL) and $(BASE_URL)/" >&2; \
	exit 1

e2e-playwright: up
	@set -euo pipefail; \
	trap '$(MAKE) -C $(ROOT_DIR) down' EXIT; \
	cd frontend && npm ci && npm run test:e2e

e2e-playwright-in-docker:
	@set -euo pipefail; \
	trap '$(MAKE) -C $(ROOT_DIR) down' EXIT; \
	$(MAKE) -C $(ROOT_DIR) up; \
	$(MAKE) -C $(ROOT_DIR) wait; \
	$(COMPOSE) --profile playwright run --rm -e PLAYWRIGHT_BASE_URL=$(PLAYWRIGHT_BASE_URL) playwright

e2e-cypress: up
	@set -euo pipefail; \
	trap '$(MAKE) -C $(ROOT_DIR) down' EXIT; \
	cd frontend && npm ci && npm run test:e2e:cypress

e2e-cypress-in-docker:
	@set -euo pipefail; \
	trap '$(MAKE) -C $(ROOT_DIR) down' EXIT; \
	$(MAKE) -C $(ROOT_DIR) up; \
	$(MAKE) -C $(ROOT_DIR) wait; \
	$(COMPOSE) --profile cypress run --rm cypress

e2e-selenium: up
	@set -euo pipefail; \
	trap '$(MAKE) -C $(ROOT_DIR) down' EXIT; \
	cd frontend && npm ci && npm run test:e2e:selenium

e2e-selenium-remote: up
	@set -euo pipefail; \
	trap '$(MAKE) -C $(ROOT_DIR) down' EXIT; \
	$(COMPOSE) --profiles remote up -d browserless; \
	$(MAKE) -C $(ROOT_DIR) wait; \
	cd frontend && npm ci && SELENIUM_BASE_URL=http://nginx:8088 SELENIUM_REMOTE_URL=http://localhost:3000/webdriver npm run test:e2e:selenium:remote
