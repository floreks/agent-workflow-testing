SHELL := /bin/bash

ROOT_DIR := $(abspath $(CURDIR))
COMPOSE ?= docker compose

.PHONY: up
up: down
	$(COMPOSE) up -d --build

.PHONY: down
down:
	$(COMPOSE) down -v

## Local E2E

.PHONY: e2e-playwright
e2e-playwright: up
	@set -euo pipefail; \
	trap '$(MAKE) -C $(ROOT_DIR) down' EXIT; \
	cd frontend && npm ci && npm run test:e2e:playwright

.PHONY: e2e-cypress
e2e-cypress: up
	@set -euo pipefail; \
	trap '$(MAKE) -C $(ROOT_DIR) down' EXIT; \
	cd frontend && npm ci && npm run test:e2e:cypress

.PHONY: e2e-selenium
e2e-selenium: up
	@set -euo pipefail; \
	trap '$(MAKE) -C $(ROOT_DIR) down' EXIT; \
	cd frontend && npm ci && npm run test:e2e:selenium

## Full E2E in Docker
# When running in docker all containers must be connecting using internal docker networking, container names and internal ports.

.PHONY: e2e-playwright-in-docker
e2e-playwright-in-docker:
	@set -euo pipefail; \
	trap '$(MAKE) -C $(ROOT_DIR) down' EXIT; \
	$(MAKE) -C $(ROOT_DIR) up; \
	$(COMPOSE) --profile playwright run --rm playwright

.PHONY: e2e-cypress-in-docker
e2e-cypress-in-docker:
	@set -euo pipefail; \
	trap '$(MAKE) -C $(ROOT_DIR) down' EXIT; \
	$(MAKE) -C $(ROOT_DIR) up; \
	$(COMPOSE) --profile cypress run --rm cypress

.PHONY: e2e-selenium-in-docker
e2e-selenium-in-docker:
	@set -euo pipefail; \
	trap '$(MAKE) -C $(ROOT_DIR) down' EXIT; \
	$(MAKE) -C $(ROOT_DIR) up; \
	$(COMPOSE) --profile selenium run --rm selenium

## E2E in Docker w/ browserless on host
# When running in docker w/ remote browser on host, test containers must be using host networking for app access and remote browser.

.PHONY: docker-browserless
docker-browserless:
	@$(COMPOSE) --profile browserless run --rm -d browserless

.PHONY: e2e-playwright-remote
e2e-playwright-remote:
	@$(COMPOSE) --profile e2e-playwright-remote run --rm e2e-playwright-remote

.PHONY: e2e-selenium-remote
e2e-selenium-remote:
	@$(COMPOSE) --profile e2e-selenium-remote run --rm e2e-selenium-remote

.PHONY: docker-selenium-browser
docker-selenium-browser:
	docker-compose --profile selenium-browser run --rm -d selenium-browser

