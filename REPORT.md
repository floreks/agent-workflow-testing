# Trivy Go CVE Report

Generated: **2026-05-27**

This report captures the output of a vulnerability scan focused on **Go module (gomod) library dependencies** using Trivy’s official Docker image.

## Scan details

- Scanner: `aquasec/trivy:0.54.1`
- Command (table output):
  ```bash
  docker run --rm -v "$PWD":/workspace -w /workspace aquasec/trivy:0.54.1 \
    fs --scanners vuln --pkg-types library --format table \
    --output trivy-results/trivy-go-table.txt .
  ```
- Command (JSON output):
  ```bash
  docker run --rm -v "$PWD":/workspace -w /workspace aquasec/trivy:0.54.1 \
    fs --scanners vuln --pkg-types library --format json \
    --output trivy-results/trivy-go.json .
  ```
- Scope:
  - Repository filesystem scan (`trivy fs`) with vulnerability scanning enabled.
  - Go modules detected in:
    - `backend/go.mod`
    - `shared/go.mod`

Outputs saved to:
- `trivy-results/trivy-go-table.txt`
- `trivy-results/trivy-go.json`

## Summary of findings (Go dependencies)

Total vulnerabilities found: **6**

- **CRITICAL:** 2
- **HIGH:** 1
- **MEDIUM:** 2
- **LOW:** 1

All findings were associated with `backend/go.mod` dependencies.

## Findings

| Severity | Vulnerability | Package | Installed | Fixed version | Detected in |
|---|---|---|---|---|---|
| CRITICAL | CVE-2024-45337 | `golang.org/x/crypto` | 0.17.0 | 0.31.0 | `backend/go.mod` |
| CRITICAL | CVE-2026-33816 | `github.com/jackc/pgx/v5` | 5.5.5 | 5.9.0 | `backend/go.mod` |
| HIGH | CVE-2025-22869 | `golang.org/x/crypto` | 0.17.0 | 0.35.0 | `backend/go.mod` |
| MEDIUM | CVE-2025-47914 | `golang.org/x/crypto` | 0.17.0 | 0.45.0 | `backend/go.mod` |
| MEDIUM | CVE-2025-58181 | `golang.org/x/crypto` | 0.17.0 | 0.45.0 | `backend/go.mod` |
| LOW | CVE-2026-41889 | `github.com/jackc/pgx/v5` | 5.5.5 | 5.9.2 | `backend/go.mod` |

## Recommended remediation

1. **Update `golang.org/x/crypto`**
   - Currently pinned (indirect) at `v0.17.0` in `backend/go.mod`.
   - Trivy reports fixes across multiple advisories at `v0.31.0`, `v0.35.0`, and `v0.45.0`.
   - Practical remediation: update to at least the highest fixed version reported (**`v0.45.0`**) to cover all listed CVEs.

2. **Update `github.com/jackc/pgx/v5`**
   - Currently pinned at `v5.5.5` in `backend/go.mod`.
   - Trivy reports fixes at `v5.9.0` (for CVE-2026-33816) and `v5.9.2` (for CVE-2026-41889).
   - Practical remediation: update to at least **`v5.9.2`**.

3. After dependency updates:
   - Run `go mod tidy` within `backend/` (and any other module where versions change).
   - Re-run the Trivy scan commands above.

## Notes / limitations

- This report focuses on **Go dependency CVEs** as detected by Trivy’s `gomod` analyzer.
- Trivy’s `fs` scan may also detect vulnerabilities for other ecosystems (e.g. `npm`) if lockfiles are present; those are **out of scope** for this Go-focused report.
- The Trivy vulnerability database was downloaded at scan time (see Trivy logs in the scan output).

## Trivy (Docker Compose)

To reproduce the Go dependency scan via Docker Compose:

```bash
docker compose -f docker-compose.trivy.yml run --rm trivy-go
```

This writes output to:
- `trivy-results/trivy-go-table.txt`

(See `docker-compose.trivy.yml` for the exact Trivy invocation.)
