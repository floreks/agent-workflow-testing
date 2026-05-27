# Go CVE Security Report

**Generated:** 2026-05-27
**Tool:** [Trivy](https://github.com/aquasec/trivy) v0.70.0 (Docker image `aquasec/trivy:latest`)
**Scan type:** Filesystem — Go modules (`gomod`)
**Repository:** `https://github.com/floreks/agent-workflow-testing.git`
**Scanned file:** `backend/go.mod`
**Database source:** GitHub Security Advisory Go (GHSA)

---

## Executive Summary

| Severity | Count |
|----------|-------|
| 🔴 CRITICAL | 2 |
| 🟠 HIGH     | 1 |
| 🟡 MEDIUM   | 2 |
| 🟢 LOW      | 1 |
| **Total**   | **6** |

All 6 vulnerabilities have fixes available. Two distinct Go packages are affected:

| Package | Installed | Vulnerabilities | Fix target |
|---------|-----------|-----------------|------------|
| `github.com/jackc/pgx/v5` | `v5.5.5` | 2 (1 CRITICAL, 1 LOW) | `v5.9.2` |
| `golang.org/x/crypto` | `v0.17.0` | 4 (1 CRITICAL, 1 HIGH, 2 MEDIUM) | `v0.45.0` |

---

## Vulnerability Details

---

### 1. CVE-2026-33816 — CRITICAL

| Field | Value |
|-------|-------|
| **CVE ID** | [CVE-2026-33816](https://avd.aquasec.com/nvd/cve-2026-33816) |
| **GHSA ID** | [GHSA-9jj7-4m8r-rfcm](https://github.com/advisories/GHSA-9jj7-4m8r-rfcm) |
| **Package** | `github.com/jackc/pgx/v5` |
| **Installed version** | `v5.5.5` |
| **Fixed version** | `v5.9.0` |
| **CVSS v3 score (GHSA)** | **9.8** — `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H` |
| **CVSS v3 score (Red Hat)** | 8.3 — `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:L` |
| **Published** | 2026-04-07 |
| **Last modified** | 2026-05-21 |
| **Go vuln DB** | [GO-2026-4772](https://pkg.go.dev/vuln/GO-2026-4772) |

**Description:**
Memory-safety vulnerability in `github.com/jackc/pgx/v5`. A remote, unauthenticated attacker can exploit this flaw to potentially read and write arbitrary memory, leading to full confidentiality, integrity, and availability compromise of the affected service.

**Remediation:**
Upgrade `github.com/jackc/pgx/v5` to **`v5.9.0`** or later in `backend/go.mod`.

**References:**
- https://nvd.nist.gov/vuln/detail/CVE-2026-33816
- https://pkg.go.dev/vuln/GO-2026-4772
- https://access.redhat.com/errata/RHSA-2026:19137

---

### 2. CVE-2024-45337 — CRITICAL

| Field | Value |
|-------|-------|
| **CVE ID** | [CVE-2024-45337](https://avd.aquasec.com/nvd/cve-2024-45337) |
| **GHSA ID** | [GHSA-v778-237x-gjrc](https://github.com/advisories/GHSA-v778-237x-gjrc) |
| **Package** | `golang.org/x/crypto` |
| **Installed version** | `v0.17.0` |
| **Fixed version** | `v0.31.0` |
| **CVSS v3 score (GHSA)** | **9.1** — `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N` |
| **Published** | 2024-12-12 |
| **Last modified** | 2026-04-15 |
| **Go vuln DB** | [GO-2024-3321](https://pkg.go.dev/vuln/GO-2024-3321) |

**Description:**
Applications and libraries that misuse `connection.serverAuthenticate` via the `ServerConfig.PublicKeyCallback` callback field in `golang.org/x/ssh` may be susceptible to an **authorization bypass**. The SSH protocol allows clients to advertise acceptable public keys before proving possession of the private key. `PublicKeyCallback` may be called with multiple keys in sequence; a vulnerable application may base authorization decisions on the last key presented rather than the key actually used for authentication. An attacker can send a benign key *A* followed by a privileged key *B*, authenticate with *A*, and potentially gain the access rights associated with *B*.

As a mitigation, `golang.org/x/crypto@v0.31.0` enforces that the last key passed to `PublicKeyCallback` is the one used to authenticate; however, the root fix is to use the `Permissions.Extensions` field instead of external state.

**Remediation:**
Upgrade `golang.org/x/crypto` to **`v0.31.0`** or later (recommend `v0.45.0` to also fix all lower-severity findings) in `backend/go.mod`.

**References:**
- https://nvd.nist.gov/vuln/detail/CVE-2024-45337
- https://pkg.go.dev/vuln/GO-2024-3321
- https://go.dev/issue/70779

---

### 3. CVE-2025-22869 — HIGH

| Field | Value |
|-------|-------|
| **CVE ID** | [CVE-2025-22869](https://avd.aquasec.com/nvd/cve-2025-22869) |
| **GHSA ID** | [GHSA-hcg3-q754-cr77](https://github.com/advisories/GHSA-hcg3-q754-cr77) |
| **CWE** | CWE-770 (Allocation of Resources Without Limits) |
| **Package** | `golang.org/x/crypto` |
| **Installed version** | `v0.17.0` |
| **Fixed version** | `v0.35.0` |
| **CVSS v3 score (GHSA)** | **7.5** — `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H` |
| **Published** | 2025-02-26 |
| **Last modified** | 2025-05-01 |
| **Go vuln DB** | [GO-2025-3487](https://pkg.go.dev/vuln/GO-2025-3487) |

**Description:**
SSH servers that implement file-transfer protocols using `golang.org/x/crypto/ssh` are vulnerable to a **Denial of Service** attack. A client that deliberately completes the key-exchange slowly, or never completes it, causes pending data to accumulate in memory without bound. An attacker can exhaust server memory and crash the process.

**Remediation:**
Upgrade `golang.org/x/crypto` to **`v0.35.0`** or later in `backend/go.mod`.

**References:**
- https://nvd.nist.gov/vuln/detail/CVE-2025-22869
- https://pkg.go.dev/vuln/GO-2025-3487
- https://go.dev/issue/71931

---

### 4. CVE-2025-47914 — MEDIUM

| Field | Value |
|-------|-------|
| **CVE ID** | [CVE-2025-47914](https://avd.aquasec.com/nvd/cve-2025-47914) |
| **GHSA ID** | [GHSA-f6x5-jh6r-wrfv](https://github.com/advisories/GHSA-f6x5-jh6r-wrfv) |
| **CWE** | CWE-125 (Out-of-bounds Read) |
| **Package** | `golang.org/x/crypto` |
| **Installed version** | `v0.17.0` |
| **Fixed version** | `v0.45.0` |
| **CVSS v3 score (GHSA)** | **5.3** — `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L` |
| **Published** | 2025-11-19 |
| **Last modified** | 2025-12-11 |
| **Go vuln DB** | [GO-2025-4135](https://pkg.go.dev/vuln/GO-2025-4135) |

**Description:**
SSH Agent servers in `golang.org/x/crypto/ssh/agent` do not validate the size of messages when processing **new identity (add key) requests**. A malformed message can trigger an out-of-bounds read, causing a panic and crashing the server process — a remote **Denial of Service**.

**Remediation:**
Upgrade `golang.org/x/crypto` to **`v0.45.0`** in `backend/go.mod`.

**References:**
- https://nvd.nist.gov/vuln/detail/CVE-2025-47914
- https://pkg.go.dev/vuln/GO-2025-4135
- https://go.dev/issue/76364

---

### 5. CVE-2025-58181 — MEDIUM

| Field | Value |
|-------|-------|
| **CVE ID** | [CVE-2025-58181](https://avd.aquasec.com/nvd/cve-2025-58181) |
| **GHSA ID** | [GHSA-j5w8-q4qc-rx2x](https://github.com/advisories/GHSA-j5w8-q4qc-rx2x) |
| **CWE** | CWE-770 (Allocation of Resources Without Limits) |
| **Package** | `golang.org/x/crypto` |
| **Installed version** | `v0.17.0` |
| **Fixed version** | `v0.45.0` |
| **CVSS v3 score (GHSA)** | **5.3** — `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:L` |
| **Published** | 2025-11-19 |
| **Last modified** | 2025-12-11 |
| **Go vuln DB** | [GO-2025-4134](https://pkg.go.dev/vuln/GO-2025-4134) |

**Description:**
SSH servers parsing **GSSAPI authentication requests** in `golang.org/x/crypto/ssh` do not validate the number of authentication mechanisms specified in the request. An unauthenticated attacker can send a malformed request with an unbounded number of mechanisms, causing the server to consume unbounded memory — a remote **Denial of Service**.

**Remediation:**
Upgrade `golang.org/x/crypto` to **`v0.45.0`** in `backend/go.mod`.

**References:**
- https://nvd.nist.gov/vuln/detail/CVE-2025-58181
- https://pkg.go.dev/vuln/GO-2025-4134
- https://go.dev/issue/76363

---

### 6. CVE-2026-41889 — LOW

| Field | Value |
|-------|-------|
| **CVE ID** | [CVE-2026-41889](https://avd.aquasec.com/nvd/cve-2026-41889) |
| **GHSA ID** | [GHSA-j88v-2chj-qfwx](https://github.com/advisories/GHSA-j88v-2chj-qfwx) |
| **CWE** | CWE-89 (SQL Injection) |
| **Package** | `github.com/jackc/pgx/v5` |
| **Installed version** | `v5.5.5` |
| **Fixed version** | `v5.9.2` |
| **CVSS v4 score (GHSA)** | **2.3** — `CVSS:4.0/AV:N/AC:H/AT:P/PR:L/UI:N/VC:N/VI:L/VA:N/SC:N/SI:N/SA:N` |
| **CVSS v3 score (NVD)** | 9.8 *(NVD severity differs from GHSA; GHSA is the authoritative source for this advisory)* |
| **Published** | 2026-05-08 |
| **Last modified** | 2026-05-21 |

**Description:**
SQL injection can occur in `github.com/jackc/pgx/v5` when **all three** of the following conditions hold simultaneously:
1. The non-default **simple protocol** is used (instead of the extended/parameterized protocol),
2. A **dollar-quoted string literal** is present in the SQL query (e.g., `$$...$$`),
3. The content of that string literal contains text that resembles a placeholder (e.g., `$1`) **and** that value is attacker-controlled.

Under these conditions a crafted input can escape the string literal context and inject arbitrary SQL. The attack requires the application to use the simple protocol with dollar-quoted literals and user-supplied input — a narrow but real attack surface.

**Remediation:**
Upgrade `github.com/jackc/pgx/v5` to **`v5.9.2`** in `backend/go.mod`.

**References:**
- https://nvd.nist.gov/vuln/detail/CVE-2026-41889
- https://github.com/jackc/pgx/security/advisories/GHSA-j88v-2chj-qfwx
- https://github.com/jackc/pgx/releases/tag/v5.9.2

---

## Recommended Remediation

Update `backend/go.mod` with the following minimum versions. Bumping to the highest fix version for each package resolves **all** findings simultaneously:

```diff
 require (
-    github.com/jackc/pgx/v5 v5.5.5
+    github.com/jackc/pgx/v5 v5.9.2

-    golang.org/x/crypto v0.17.0
+    golang.org/x/crypto v0.45.0
 )
```

After editing `go.mod`, run:

```bash
go mod tidy
go mod verify
```

Then re-run Trivy to confirm all findings are resolved:

```bash
docker run --rm -v $(pwd):/repo aquasec/trivy:latest fs --scanners vuln /repo
```

---

## Scan Metadata

| Field | Value |
|-------|-------|
| Trivy version | 0.70.0 |
| DB source | GitHub Security Advisory Go (GHSA) |
| Scan date | 2026-05-27 |
| Artifact | `/repo` (filesystem) |
| Repo URL | https://github.com/floreks/agent-workflow-testing.git |
| Branch | master |
| Commit | `b089290c84cac42574e2e1012d3558d1fa6efd74` |
