# Go Dependency Security Scan Report

This report presents the security analysis of the Go dependencies used in the project, scanned using **Aquasec Trivy** via Docker.

## Executive Summary

- **Scan Date**: Wednesday, May 27, 2026
- **Tool Used**: Aquasec Trivy (Docker image `aquasec/trivy:latest`)
- **Scanned Targets**:
  - `backend/go.mod` (Go modules dependency tree)
  - `shared/go.mod` (Go modules dependency tree)
- **Total Vulnerabilities Found**: **6**

### Vulnerability Severity Breakdown

| Severity | Count | Status |
|---|---|---|
| **Critical** | 2 | Action Required (Update Available) |
| **High** | 1 | Action Required (Update Available) |
| **Medium** | 2 | Action Required (Update Available) |
| **Low** | 1 | Action Required (Update Available) |
| **Unknown** | 0 | - |
| **Total** | **6** | |

---

## Detailed Scan Findings

### 1. Target: `backend/go.mod`

The following Go libraries have known security vulnerabilities:

#### A. `github.com/jackc/pgx/v5`
- **Installed Version**: `v5.5.5`
- **Fixed Version**: `5.9.2` (for all findings)

| CVE ID | Severity | Status | Fixed In | Description & Reference |
|---|---|---|---|---|
| **CVE-2026-33816** | **CRITICAL** | Fixed | `5.9.0` | **Memory-safety vulnerability** in `github.com/jackc/pgx/v5`. <br> More info: [CVE-2026-33816](https://avd.aquasec.com/nvd/cve-2026-33816) |
| **CVE-2026-41889** | **LOW** | Fixed | `5.9.2` | **SQL injection via specific SQL query conditions** in `github.com/jackc/pgx`. <br> More info: [CVE-2026-41889](https://avd.aquasec.com/nvd/cve-2026-41889) |

#### B. `golang.org/x/crypto`
- **Installed Version**: `v0.17.0`
- **Fixed Version**: `0.45.0` (for all findings)

| CVE ID | Severity | Status | Fixed In | Description & Reference |
|---|---|---|---|---|
| **CVE-2024-45337** | **CRITICAL** | Fixed | `0.31.0` | Applications and libraries which misuse `connection.serverAuthenticate` are vulnerable. <br> More info: [CVE-2024-45337](https://avd.aquasec.com/nvd/cve-2024-45337) |
| **CVE-2025-22869** | **HIGH** | Fixed | `0.35.0` | SSH servers which implement file transfer protocols are vulnerable. <br> More info: [CVE-2025-22869](https://avd.aquasec.com/nvd/cve-2025-22869) |
| **CVE-2025-47914** | **MEDIUM** | Fixed | `0.45.0` | SSH Agent servers do not validate the size of messages when processing. <br> More info: [CVE-2025-47914](https://avd.aquasec.com/nvd/cve-2025-47914) |
| **CVE-2025-58181** | **MEDIUM** | Fixed | `0.45.0` | SSH servers parsing GSSAPI authentication requests do not validate the input. <br> More info: [CVE-2025-58181](https://avd.aquasec.com/nvd/cve-2025-58181) |

---

### 2. Target: `shared/go.mod`
- **Status**: **Clean** (0 security findings detected)

---

## Remediation Recommendations

To address these vulnerabilities, it is highly recommended to update the affected Go dependencies in `/backend/go.mod`.

### Recommended Updates

1. **Upgrade `github.com/jackc/pgx/v5`** from `v5.5.5` to **`v5.9.2`** (or newer):
   ```bash
   cd backend
   go get github.com/jackc/pgx/v5@v5.9.2
   ```
2. **Upgrade `golang.org/x/crypto`** from `v0.17.0` to **`0.45.0`** (or newer):
   ```bash
   cd backend
   go get golang.org/x/crypto@v0.45.0
   ```
3. **Tidy up the module dependencies**:
   ```bash
   go mod tidy
   ```

---
*Report generated automatically by Plural Security Scan Agent.*
