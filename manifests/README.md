# Plural GitOps manifests

This repository now includes a minimal `manifests/` tree for a simple Plural GitOps setup.

## Layout

- `plural/` contains the Plural management CRs:
  - `GitRepository` registers this GitHub repository as a source repo.
  - `ServiceDeployment` deploys the raw Kubernetes manifests from `app/`.
- `app/` contains a small Kubernetes workload made of:
  - `Namespace`
  - `Deployment`
  - `Service`

## Why `ServiceDeployment` here?

This example targets a single known cluster (`mgmt`), so `ServiceDeployment` is the right fit.
Use a `GlobalService` instead when you want Plural to fan the same workload out to every
matching cluster, such as a fleet-wide add-on or shared platform component.

## Assumptions

- The target Plural cluster handle is `mgmt`.
- The source branch is `master`.
- The repo is public, so the `GitRepository` does not need credentials.

Adjust those values if your Plural management cluster uses a different handle, branch, or authentication model.
