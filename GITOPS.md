# Plural GitOps

This repository includes a minimal Plural GitOps example that wires a source repository to a service deployment.

## Custom resources in this repo

### `GitRepository`

Defined in `manifests/repositories/agent-workflow-testing-source.yaml`.

This Plural CRD registers the source repository that Plural should clone for application manifests:

- `kind: GitRepository`
- `metadata.name: agent-workflow-testing-source`
- `spec.url: https://github.com/floreks/agent-workflow-testing.git`

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

## Application manifests

The raw Kubernetes manifests referenced by the `ServiceDeployment` live in `manifests/apps/agent-workflow-testing/`:

- `namespace.yaml`
- `deployment.yaml`
- `service.yaml`

Together, these resources create a namespace and run a simple nginx service through Plural GitOps.
