# Selenium Remote E2E (Always Run in Docker)

Always run E2E tests in Docker, and always connect from the container to the remote
browser exposed on `http://localhost:3000` via host networking.

1) Ensure the app is reachable at `http://localhost:8088`.
2) Run the Selenium E2E suite in Docker with host networking:

```bash
docker run --rm --network host \
  -v "$PWD/frontend:/app/frontend" \
  -w /app/frontend \
  node:25 sh -c "npm ci && SELENIUM_BASE_URL=http://localhost:8088 SELENIUM_REMOTE_URL=http://localhost:3000 node --test selenium/app.test.js"
```

If the app runs on a different host/port, update `SELENIUM_BASE_URL` accordingly.

Agents must always confirm any changes by running the E2E tests above.
