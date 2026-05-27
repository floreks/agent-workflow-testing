# Trivy Go CVE Scan Report

Date: 2026-05-27

## Scope
This repository is a Go + React project with a Go workspace (`go.work`) that includes:

- `backend/` (module: `agent-workflow-testing/backend`)
- `shared/` (module: `agent-workflow-testing/shared`)

The request was to **use the Docker Trivy image** to check for **Go CVEs** (dependency vulnerabilities) and produce a report.

## Attempted approach (Trivy via container)
Trivy is typically run using the official container image, e.g.:

```bash
docker run --rm -v "$PWD":/repo -w /repo aquasec/trivy:latest fs --scanners vuln --severity HIGH,CRITICAL --format table .
```

Or for Go module analysis (depending on Trivy version/features):

```bash
docker run --rm -v "$PWD":/repo -w /repo aquasec/trivy:latest fs --scanners vuln --format json backend shared
```

## Environment constraints encountered
In this execution environment, **container execution was not possible**, so the Trivy image could not be run.

### Docker daemon unavailable
- `docker` client is present, but no daemon socket is available.
- With `DOCKER_HOST` unset, `docker info` fails to connect to `/var/run/docker.sock`.

Observed error (representative):

- `dial unix /var/run/docker.sock: connect: no such file or directory`

### Podman (rootless) unavailable
`podman version` fails due to user-namespace mapping restrictions:

- `cannot set up namespace using "/usr/bin/newuidmap": exit status 1`

### Local Trivy and Go CLIs not installed
- `trivy` is not installed on the host (`command not found`).
- `go` is not installed on the host (`command not found`).

## Findings
Because the Trivy container could not be executed (no working container runtime), **no CVE scan results could be produced** from this environment.

## What to run in a working environment
From the repository root, with a working Docker daemon, run:

1) **Filesystem vulnerability scan** (includes Go module deps where supported):

```bash
docker run --rm \
  -v "$PWD":/repo \
  -w /repo \
  aquasec/trivy:latest \
  fs --scanners vuln --severity LOW,MEDIUM,HIGH,CRITICAL --ignore-unfixed .
```

2) **Focused scan** on Go modules:

```bash
docker run --rm \
  -v "$PWD":/repo \
  -w /repo \
  aquasec/trivy:latest \
  fs --scanners vuln --severity LOW,MEDIUM,HIGH,CRITICAL --ignore-unfixed backend shared
```

3) Optional: output JSON for CI ingestion:

```bash
docker run --rm \
  -v "$PWD":/repo \
  -w /repo \
  aquasec/trivy:latest \
  fs --scanners vuln --format json --output trivy-report.json --ignore-unfixed .
```

## Remediation guidance (once results exist)
When vulnerabilities are reported, typical remediations are:

- **Bump Go dependencies** in `backend/go.mod` (and any other modules) to patched versions.
- Run `go mod tidy` in each module (or `go work sync` if applicable) and re-scan.
- For transitive vulnerabilities, update the direct dependency that pins the transitive module.

## Notes / limitations
- This report documents the **scan attempt** and provides exact commands to reproduce the intended Trivy scan.
- Actual CVE counts/severities depend on the Trivy DB at scan time and the resolved dependency graph.
