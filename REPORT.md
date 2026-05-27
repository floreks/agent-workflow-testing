# Go CVE Report (Trivy)

Date: 2026-05-27

## Objective
Scan this repository for **Go dependency vulnerabilities (CVEs)** using the **Trivy Docker image** and produce a report.

## Environment / Tooling Status
Attempted to run Trivy via Docker:

- `docker run --rm aquasec/trivy:latest --version`
- `DOCKER_HOST=unix:///var/run/docker.sock docker run --rm aquasec/trivy:latest --version`
- `docker info`

All attempts failed because the Docker daemon/socket is not available in this environment:

- Docker client is installed, but there is no reachable server socket.
- Errors observed:
  - `failed to connect to the docker API at unix:///run/user/65532/podman/podman.sock ... no such file or directory`
  - `failed to connect to the docker API at unix:///var/run/docker.sock ... no such file or directory`

Also confirmed there is no local `trivy` binary available:

- `trivy --version` → `command not found`

## Repository Go Modules Detected
This repo uses a Go workspace:

- `go.work` uses:
  - `./backend`
  - `./shared`

Go module files found:

- `backend/go.mod` / `backend/go.sum`
- `shared/go.mod` (no `shared/go.sum` present)

## Result
**No Trivy scan could be executed**, therefore **no CVE findings can be reported** from Trivy at this time.

## How to Run the Intended Scan (when Docker daemon is available)
From the repo root:

```bash
# Scan Go modules for known vulnerabilities
docker run --rm \
  -v "$PWD:/repo" \
  -w /repo \
  aquasec/trivy:latest \
  fs --scanners vuln --languages go --format table /repo
```

Optional: generate a JSON report:

```bash
docker run --rm \
  -v "$PWD:/repo" \
  -w /repo \
  aquasec/trivy:latest \
  fs --scanners vuln --languages go --format json -o /repo/trivy-go-report.json /repo
```

## Notes / Follow-ups
- If this environment is expected to support Docker-in-Docker, ensure the Docker daemon is started and the socket is mounted/available at `/var/run/docker.sock` (or set `DOCKER_HOST` appropriately).
- Once Docker is functional, re-run the commands above to produce an actual CVE list.
