# Plural GitOps

This repository includes a minimal Plural GitOps example that wires a source repository to a service deployment.

Plural GitOps objects in this repo use `apiVersion: deployments.plural.sh/v1alpha1`.

## Custom resources in this repo

### `GitRepository`

Defined in `manifests/repositories/agent-workflow-testing-source.yaml`.

This Plural CRD registers the source repository that Plural should clone for application manifests:

- `kind: GitRepository`
- `metadata.name: agent-workflow-testing-source`
- `spec.url: https://github.com/floreks/agent-workflow-testing.git`

In practice, `GitRepository` is the reusable pointer to a git source. Other Plural resources can reference it instead of repeating the same repository URL everywhere.

### `ServiceDeployment`

Defined in `manifests/services/agent-workflow-testing.yaml`.

This Plural CRD tells Plural to deploy the manifests from the registered repository onto the `mgmt` cluster:

- `kind: ServiceDeployment`
- `metadata.name: agent-workflow-testing`
- `spec.cluster: mgmt`
- `spec.repositoryRef.name: agent-workflow-testing-source`
- `spec.git.ref: master`
- `spec.git.folder: manifests/apps/agent-workflow-testing`
- `spec.namespace: agent-workflow-testing`

`ServiceDeployment` is the core single-cluster workload CRD in Plural GitOps. It points at a cluster, a source repository, and the folder or chart that should be rendered and applied there.

## Other Plural GitOps CRDs I know

These CRDs are not all used in this repository, but they are the main Plural GitOps resources I know and would typically expect to see in a Plural GitOps repo.

### `Cluster`

Represents a target cluster known to Plural. Other resources commonly reference the cluster handle from this CRD, such as `spec.cluster: mgmt` in a `ServiceDeployment` or `InfrastructureStack`.

### `GlobalService`

A fleet-style service definition. Instead of targeting one cluster directly, it defines a service template that Plural expands into per-cluster `ServiceDeployment` resources for every matching cluster.

### `ServiceContext`

A reusable bundle of service configuration that can be attached to one or more `ServiceDeployment` or `GlobalService` resources. It is useful for sharing common values, environment settings, or templating inputs.

### `InfrastructureStack`

The infrastructure-focused GitOps CRD. It points at Terraform, Terragrunt, or similar infrastructure code in git so Plural can manage infra runs and expose outputs for services to consume.

### `ScmConnection`

A shared source control connection definition that Plural can use for git authentication. `GitRepository` resources can reference it so multiple repositories can reuse the same credential or SCM integration.

### `Observer`

A trigger-style CRD used for event-driven GitOps automation. It watches for upstream changes and can kick off follow-up actions when the observed source changes.

### `Pipeline`

A deployment workflow or promotion CRD. It is used to model staged rollouts or promotion rules across environments instead of treating each deployment as an isolated one-off action.

## Application manifests

The raw Kubernetes manifests referenced by the `ServiceDeployment` live in `manifests/apps/agent-workflow-testing/`:

- `namespace.yaml`
- `deployment.yaml`
- `service.yaml`

Together, these resources create a namespace and run a simple nginx service through Plural GitOps.
