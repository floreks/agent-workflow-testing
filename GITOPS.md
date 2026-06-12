# Plural GitOps objects

This repository currently defines a minimal Plural GitOps setup under `manifests/`.

## Objects in this repo

### GitRepository

- **File:** `manifests/git-repository.yaml`
- **Purpose:** registers a source git repository that Plural can clone for deployments.
- **Key fields:**
  - `spec.url`: source repository URL.
  - `spec.connectionRef`: optional SCM connection reference for auth.
  - `spec.credentialsRef`: optional secret reference for direct credentials.

### ServiceDeployment

- **File:** `manifests/service-deployment.yaml`
- **Purpose:** deploys one service to one target cluster.
- **Key fields:**
  - `spec.cluster`: target cluster handle.
  - `spec.repositoryRef`: points to a `GitRepository` object.
  - `spec.git.ref`: branch, tag, or commit to deploy.
  - `spec.git.folder`: folder inside the source repo containing manifests.
  - `spec.namespace`: namespace to deploy into on the target cluster.

## Common Plural GitOps objects

### Cluster

- Represents a managed cluster in Plural.
- `spec.handle` is the short identifier used by services and stacks.
- Often includes tags and metadata used for fleet targeting and templating.

### GlobalService

- Deploys the same workload to every cluster matching selectors.
- Uses `spec.template` to describe the service definition reused per cluster.
- Creates one child `ServiceDeployment` for each matching cluster.

### InfrastructureStack

- Runs Terraform, Terragrunt, or Ansible from git.
- Typically references a `GitRepository` plus a git `ref` and `folder`.
- Can export outputs consumed by services.

### ServiceContext

- Reusable configuration block for services.
- Lets multiple services share common settings or environment data.

### ScmConnection

- Stores reusable SCM authentication for git providers.
- Can be referenced by `GitRepository.spec.connectionRef`.

## Typical relationship

1. A `GitRepository` registers a source repo.
2. A `ServiceDeployment` or `InfrastructureStack` references that repo.
3. A `GlobalService` can template a service across many clusters.
4. `Cluster` metadata, `ServiceContext`, and stack outputs can feed service configuration.

## Notes for this repo

- `GitRepository` is cluster-scoped.
- `ServiceDeployment` is namespaced here under `infra`.
- The service currently targets the `mgmt` cluster and deploys manifests from `manifests/app`.
