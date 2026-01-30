SHELL := /bin/bash

ROOT_DIR := $(abspath $(CURDIR))
COMPOSE ?= docker compose
BASE_URL ?= http://localhost:8088
PLAYWRIGHT_BASE_URL ?= http://nginx
HEALTH_URL := $(BASE_URL)/api/health

.PHONY: up down wait e2e

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

e2e-in-docker:
	@set -euo pipefail; \
	trap '$(MAKE) -C $(ROOT_DIR) down' EXIT; \
	$(MAKE) -C $(ROOT_DIR) up; \
	$(MAKE) -C $(ROOT_DIR) wait; \
	$(COMPOSE) --profile test run --rm -e PLAYWRIGHT_BASE_URL=$(PLAYWRIGHT_BASE_URL) playwright

e2e: up
	@set -euo pipefail; \
	trap '$(MAKE) -C $(ROOT_DIR) down' EXIT; \
	cd frontend && npm ci && npm run test:e2e