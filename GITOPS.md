# Plural GitOps CRD Reference

All Plural GitOps custom resources use `apiVersion: deployments.plural.sh/v1alpha1`.

## CRD Summary Table

| CRD | Kind | Scope | Purpose |
|-----|------|-------|---------|
| [GitRepository](#gitrepository) | `GitRepository` | Cluster | Registers a source git repo so services and stacks can reference it by name |
| [ServiceDeployment](#servicedeployment) | `ServiceDeployment` | Namespaced | Deploys a workload (Helm/Kustomize/raw YAML) to **one** cluster |
| [GlobalService](#globalservice) | `GlobalService` | Namespaced | Fleet multiplexer — replicates a service template to **all** clusters matching a selector |
| [InfrastructureStack](#infrastructurestack) | `InfrastructureStack` | Namespaced | Runs Terraform, Terragrunt, or Ansible IaC as batch jobs against a cluster |
| [Cluster](#cluster) | `Cluster` | Namespaced | Registers a Kubernetes cluster with Plural Console |
| [ServiceContext](#servicecontext) | `ServiceContext` | Namespaced | Named key-value bag shared across multiple ServiceDeployments via Liquid templating |
| [StackDefinition](#stackdefinition) | `StackDefinition` | Namespaced | Reusable IaC scaffold (tool version, hooks) referenced by InfrastructureStacks |
| [Observer](#observer) | `Observer` | Namespaced | Event-driven trigger that watches external sources (OCI/Helm registry, Git) and updates services |
| [Pipeline](#pipeline) | `Pipeline` | Namespaced | Ordered promotion workflow across environments with optional AI-assisted gating |
| [ScmConnection](#scmconnection) | `ScmConnection` | Namespaced | Stores SCM provider credentials (GitHub, GitLab, Bitbucket, …) for repos and PR automation |
| [PrAutomation](#prautomation) | `PrAutomation` | Namespaced | Automates pull request creation for config/version updates |
| [ManagedNamespace](#managednamespace) | `ManagedNamespace` | Namespaced | Propagates a namespace definition to all matching clusters |
| [ClusterRestore](#clusterrestore) | `ClusterRestore` | Namespaced | Triggers a point-in-time restore from a cluster backup |
| [ClusterRestoreBackup](#clusterrestorebackup) | `ClusterRestoreBackup` | Namespaced | Defines backup schedules and retention for cluster state |

---

## GitRepository

Registers a **source repository** in Plural Console. `ServiceDeployment` and `InfrastructureStack` reference it via `repositoryRef` instead of repeating the URL.

```yaml
apiVersion: deployments.plural.sh/v1alpha1
kind: GitRepository
metadata:
  name: my-app-repo          # cluster-scoped, no namespace
spec:
  url: https://github.com/my-org/my-app.git
  connectionRef:             # optional — reuse an ScmConnection for auth
    name: github
  credentialsRef:            # optional — Secret with privateKey/username/password
    name: my-app-repo-credentials
    namespace: infra
```

| Field | Description |
|-------|-------------|
| `spec.url` | HTTPS or SSH git URL — immutable after creation |
| `spec.connectionRef` | Reference to an `ScmConnection` CR for credentials |
| `spec.credentialsRef` | Direct Secret reference for repo auth |
| `status.health` | `PULLABLE` or `FAILED` |

---

## ServiceDeployment

Deploys a workload to **exactly one** cluster. Supports raw YAML, Kustomize, and Helm sources.

```yaml
apiVersion: deployments.plural.sh/v1alpha1
kind: ServiceDeployment
metadata:
  name: my-app-prod
  namespace: infra
spec:
  cluster: prod-eu-1                  # target cluster handle
  repositoryRef:
    name: my-app-repo
    namespace: infra
  git:
    ref: main
    folder: deploy/k8s
  namespace: my-app                   # namespace on the target cluster
```

| Field | Description |
|-------|-------------|
| `spec.cluster` | Short handle matching `Cluster.spec.handle` |
| `spec.clusterRef` | ObjectReference alternative to `spec.cluster` |
| `spec.git` | Git ref + folder for raw/Kustomize manifests |
| `spec.helm` | Helm chart source, values, and release name |
| `spec.kustomize` | Kustomize base path |
| `spec.namespace` | Target namespace on the cluster |
| `spec.configuration` | Non-secret key-value pairs for Liquid templating |
| `spec.configurationRef` | Secret reference for sensitive template values |
| `spec.contexts` | Names of `ServiceContext` CRs to inject |
| `spec.imports` | Consume outputs from `InfrastructureStack` runs |
| `spec.dependencies` | Services that must be healthy before this one syncs |
| `spec.protect` | Prevent accidental deletion |
| `spec.detach` | Remove from Console without deleting cluster resources |
| `spec.templated` | Enable Liquid templating on raw YAML files (default: `true`) |
| `spec.syncConfig` | Namespace creation, drift detection, ownership rules |

---

## GlobalService

Fleet multiplexer that watches all clusters matching a selector and automatically creates one `ServiceDeployment` child per matching cluster.

```yaml
apiVersion: deployments.plural.sh/v1alpha1
kind: GlobalService
metadata:
  name: datadog-agent
  namespace: infra
spec:
  tags:
    env: prod                          # cluster tag selector
  distro: EKS                          # optional distro filter
  template:                            # ServiceTemplate — top-level fields, NOT nested under .spec
    namespace: monitoring
    repositoryRef:
      name: monitoring-repo
      namespace: infra
    git:
      ref: main
      folder: agents/datadog
```

| Field | Description |
|-------|-------------|
| `spec.tags` | Map of cluster tag key-value pairs to match |
| `spec.distro` | Restrict to a specific Kubernetes distribution (`EKS`, `GKE`, `AKS`, …) |
| `spec.mgmt` | Include the management cluster (default: `false`) |
| `spec.projectRef` | Limit to clusters in a specific project |
| `spec.ignoreClusters` | Explicit list of cluster handles to exclude |
| `spec.template` | `ServiceTemplate` with the same top-level fields as `ServiceSpec` |
| `spec.serviceRef` | Reuse an existing `ServiceDeployment` as the template |
| `spec.context.raw` | YAML available to the template engine for all matched clusters |
| `spec.cascade.delete` | Delete child `ServiceDeployment`s and cluster resources on parent deletion |
| `spec.cascade.detach` | Orphan cluster resources on parent deletion |

> **When to use GlobalService vs ServiceDeployment:**
> - Use `GlobalService` for fleet-wide services (monitoring agents, security scanners, cert-manager).
> - Use `ServiceDeployment` when deploying to a single known cluster or when each environment needs meaningfully different configuration.

---

## InfrastructureStack

Runs IaC (Terraform, Terragrunt, Ansible) as batch jobs on a target cluster. Maps to **stack runs** in Plural Console.

```yaml
apiVersion: deployments.plural.sh/v1alpha1
kind: InfrastructureStack
metadata:
  name: vpc-prod-eu
  namespace: infra
spec:
  type: TERRAFORM                      # TERRAFORM | TERRAGRUNT | ANSIBLE | CUSTOM
  repositoryRef:
    name: infra-repo
    namespace: infra
  git:
    ref: main
    folder: terraform/vpc
  clusterRef:
    name: mgmt                         # cluster where the job pod runs
    namespace: infra
  manageState: true                    # Plural provisions remote state
```

| Field | Description |
|-------|-------------|
| `spec.type` | IaC tool: `TERRAFORM`, `TERRAGRUNT`, `ANSIBLE`, or `CUSTOM` |
| `spec.git` | Git ref + folder containing the IaC code |
| `spec.clusterRef` | Cluster where the batch job runs (usually mgmt cluster) |
| `spec.manageState` | Plural manages Terraform remote state when `true` |
| `spec.variables` | YAML/JSON injected as a variables file (`.tfvars.json` for Terraform) |
| `spec.environment` | Environment variables injected into the job (supports `secretRef`) |
| `spec.files` | Files mounted into the job from Secrets |
| `spec.approval` | Pause before apply for human review when `true` |
| `spec.detach` | Remove from Console without running destroy when `true` |
| `spec.cron` | Scheduled run configuration (`cron` expression + `autoApprove`) |
| `spec.configuration` | Tool version, image, and tool-specific flags |
| `spec.stackDefinitionRef` | Reference to a `StackDefinition` CR for shared scaffold |

---

## Cluster

Registers a Kubernetes cluster with Plural Console. The deployment operator connects to Console using credentials derived from this CR.

```yaml
apiVersion: deployments.plural.sh/v1alpha1
kind: Cluster
metadata:
  name: prod-eu-1
  namespace: infra
spec:
  handle: prod-eu-1                    # short unique identifier used in service references
  version: "1.29"
  tags:
    env: prod
    region: eu-west-1
  metadata:
    domain: prod.example.com           # arbitrary key-value for Liquid templating
```

| Field | Description |
|-------|-------------|
| `spec.handle` | Short string used in `ServiceDeployment.spec.cluster` and fleet selectors |
| `spec.version` | Target Kubernetes version |
| `spec.tags` | Labels used by `GlobalService` selectors |
| `spec.metadata` | Arbitrary cluster data available in Liquid templates as `cluster.metadata.<key>` |
| `spec.protect` | Prevent accidental deletion |

---

## ServiceContext

Named key-value bag injected into `ServiceDeployment` Liquid templates. Enables shared configuration across multiple services without repeating values.

```yaml
apiVersion: deployments.plural.sh/v1alpha1
kind: ServiceContext
metadata:
  name: prod-shared-config
  namespace: infra
spec:
  configuration:
    databaseHost: postgres.prod.internal
    region: eu-west-1
```

Reference in a `ServiceDeployment`:
```yaml
spec:
  contexts:
    - prod-shared-config
```

---

## StackDefinition

Reusable IaC scaffold that defines the tool version, container image, and lifecycle hooks. Multiple `InfrastructureStack` CRs can reference one `StackDefinition` to avoid duplication.

```yaml
apiVersion: deployments.plural.sh/v1alpha1
kind: StackDefinition
metadata:
  name: terraform-1-9
  namespace: infra
spec:
  configuration:
    version: "1.9.0"
    image: hashicorp/terraform
    hooks:
      - cmd: pre-plan.sh
        afterStage: INIT
```

---

## Observer

Event-driven trigger that watches an external source (OCI registry, Helm chart repo, or Git) and fires actions (e.g. updating a `ServiceDeployment` image tag) when a new version is detected.

```yaml
apiVersion: deployments.plural.sh/v1alpha1
kind: Observer
metadata:
  name: my-app-image-watcher
  namespace: infra
spec:
  target:
    order: SEMVER
    helm:
      url: https://charts.example.com
      chart: my-app
      provider: BASIC
  actions:
    - type: SERVICE
      configuration:
        serviceRef:
          name: my-app-prod
          namespace: infra
        helm:
          values: |
            image:
              tag: {{ value }}
```

| Field | Description |
|-------|-------------|
| `spec.target` | Source to watch — `helm`, `oci`, or `git` |
| `spec.target.order` | Version ordering: `SEMVER` or `LATEST` |
| `spec.actions` | List of actions to execute on new version detected |

---

## Pipeline

Ordered promotion workflow that moves a service through stages (e.g. dev → staging → prod) with optional test gates and AI-assisted promotion decisions.

```yaml
apiVersion: deployments.plural.sh/v1alpha1
kind: Pipeline
metadata:
  name: my-app-promotion
  namespace: infra
spec:
  stages:
    - name: dev
      services:
        - serviceRef:
            name: my-app-dev
            namespace: infra
    - name: prod
      services:
        - serviceRef:
            name: my-app-prod
            namespace: infra
  edges:
    - from: dev
      to: prod
      gates:
        - name: approval-gate
          type: APPROVAL
```

| Field | Description |
|-------|-------------|
| `spec.stages` | Ordered list of deployment stages |
| `spec.edges` | Directed graph edges between stages with optional gates |
| `spec.edges[*].gates` | Promotion gates: `APPROVAL`, `WINDOW` (time-based), or `JOB` |

---

## ScmConnection

Stores SCM provider credentials used by `GitRepository`, `PrAutomation`, and other CRs that need to authenticate with GitHub, GitLab, Bitbucket, etc.

```yaml
apiVersion: deployments.plural.sh/v1alpha1
kind: ScmConnection
metadata:
  name: github
  namespace: infra
spec:
  type: GITHUB                         # GITHUB | GITLAB | BITBUCKET | GITEA
  tokenSecretRef:
    name: github-token
    namespace: infra
    key: token
```

---

## PrAutomation

Automates pull request creation for version bumps or configuration changes, triggered by Observers or Pipeline promotion events.

```yaml
apiVersion: deployments.plural.sh/v1alpha1
kind: PrAutomation
metadata:
  name: bump-my-app-version
  namespace: infra
spec:
  scmConnectionRef:
    name: github
    namespace: infra
  repositoryRef:
    name: my-app-repo
    namespace: infra
  title: "chore: bump {{ context.version }}"
  branch: automation/version-bump
  updates:
    - regexReplacements:
        - file: manifests/service.yaml
          regex: 'tag: .*'
          replacement: 'tag: {{ context.version }}'
```

---

## ManagedNamespace

Propagates a namespace definition (with labels, annotations, and optional `ServiceDeployment` template) to all clusters matching a fleet selector.

```yaml
apiVersion: deployments.plural.sh/v1alpha1
kind: ManagedNamespace
metadata:
  name: monitoring
  namespace: infra
spec:
  name: monitoring
  description: "Cluster-wide monitoring namespace"
  labels:
    team: platform
  annotations:
    purpose: monitoring
  target:
    tags:
      env: prod
```

---

## ClusterRestoreBackup

Defines backup schedules and retention policies for cluster state snapshots.

```yaml
apiVersion: deployments.plural.sh/v1alpha1
kind: ClusterRestoreBackup
metadata:
  name: prod-eu-1-daily
  namespace: infra
spec:
  clusterRef:
    name: prod-eu-1
    namespace: infra
  retentionDays: 30
```

---

## ClusterRestore

Triggers a point-in-time restore of a cluster from a previously created backup.

```yaml
apiVersion: deployments.plural.sh/v1alpha1
kind: ClusterRestore
metadata:
  name: restore-prod-eu-1
  namespace: infra
spec:
  backupRef:
    name: prod-eu-1-daily
    namespace: infra
```

---

## Sync annotations (all CRDs)

These annotations can be placed on any manifest managed by a `ServiceDeployment`:

| Annotation | Effect |
|-----------|--------|
| `deployment.plural.sh/sync-options: Replace=True` | Replace (PUT) instead of server-side apply — drops absent fields |
| `deployment.plural.sh/sync-options: Force=True` | Delete and recreate on apply failure (e.g. immutable field) |
| `deployment.plural.sh/sync-wave: "<n>"` | Apply ordering — lower numbers applied first |
| `argocd.argoproj.io/sync-options` | Argo CD-compatible alias (same semantics) |
| `argocd.argoproj.io/sync-wave` | Argo CD-compatible wave alias |

---

## Official documentation

- [Management API Reference](https://docs.plural.sh/api-reference/kubernetes/management-api-reference) — full field-level CRD specs
- [Continuous Deployment overview](https://docs.plural.sh/plural-features/continuous-deployment)
- [Global services](https://docs.plural.sh/plural-features/continuous-deployment/global-service)
- [Service templating (Liquid)](https://docs.plural.sh/plural-features/continuous-deployment/service-templating)
- [Multi-source services](https://docs.plural.sh/plural-features/continuous-deployment/multi-source-services)
- [Helm services](https://docs.plural.sh/plural-features/continuous-deployment/helm-service)
- [Observer](https://docs.plural.sh/plural-features/continuous-deployment/observer)
- [Pipelines](https://docs.plural.sh/plural-features/continuous-deployment/pipelines)
- [Resource application logic](https://docs.plural.sh/plural-features/continuous-deployment/resource-application-logic)
- [Deployment operator](https://docs.plural.sh/plural-features/continuous-deployment/deployment-operator)
