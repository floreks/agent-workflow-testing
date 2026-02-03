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
# Require node and npm to be available on the host.

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

.PHONY: e2e-puppeteer
e2e-puppeteer: up
	@set -euo pipefail; \
	trap '$(MAKE) -C $(ROOT_DIR) down' EXIT; \
	cd frontend && npm ci && npm run test:e2e:puppeteer

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

## E2E in Docker w/ remote browser on host
# When running in docker w/ remote browser on host, test containers must be using host networking for app access and remote browser.

.PHONY: docker-chrome
docker-browserless:
	@$(COMPOSE) --profile chrome run --rm -d chrome

.PHONY: docker-chromium
docker-chromium:
	@$(COMPOSE) --profile chromium run --rm -d chromium

.PHONY: docker-selenium-browser
docker-selenium-browser:
	@$(COMPOSE) --profile selenium-browser run --rm -d selenium-browser

.PHONY: e2e-playwright-remote
e2e-playwright-remote:
	@$(COMPOSE) --profile e2e-playwright-remote run --rm e2e-playwright-remote

.PHONY: e2e-puppeteer-remote
e2e-puppeteer-remote:
	@$(COMPOSE) --profile e2e-puppeteer-remote run --rm e2e-puppeteer-remote

.PHONY: e2e-selenium-remote
e2e-selenium-remote:
	@$(COMPOSE) --profile e2e-selenium-remote run --rm e2e-selenium-remote
