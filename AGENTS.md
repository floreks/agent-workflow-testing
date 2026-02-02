# Selenium Remote E2E

Use this when a remote browser is already exposed on `http://localhost:3000`.

1) Ensure the app is reachable at `http://localhost:8088`.
2) Run the Selenium E2E suite against the remote browser:

```bash
SELENIUM_REMOTE_URL=http://localhost:3000/webdriver \
SELENIUM_BASE_URL=http://localhost:8088 \
make e2e-selenium
```

If the app runs on a different host/port, update `SELENIUM_BASE_URL` accordingly.
