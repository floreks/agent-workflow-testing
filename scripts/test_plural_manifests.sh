#!/usr/bin/env bash
set -euo pipefail

repo_manifest="manifests/repositories/agent-workflow-testing-source.yaml"
service_manifest="manifests/services/agent-workflow-testing.yaml"
app_dir="manifests/apps/agent-workflow-testing"

for file in \
  "$repo_manifest" \
  "$service_manifest" \
  "$app_dir/namespace.yaml" \
  "$app_dir/deployment.yaml" \
  "$app_dir/service.yaml"; do
  [[ -f "$file" ]] || {
    echo "missing expected manifest: $file" >&2
    exit 1
  }
done

grep -q '^kind: GitRepository$' "$repo_manifest"
grep -q '^  name: agent-workflow-testing-source$' "$repo_manifest"
grep -q '^  url: https://github.com/floreks/agent-workflow-testing.git$' "$repo_manifest"

grep -q '^kind: ServiceDeployment$' "$service_manifest"
grep -q '^  cluster: mgmt$' "$service_manifest"
grep -q '^    name: agent-workflow-testing-source$' "$service_manifest"
grep -q '^    folder: manifests/apps/agent-workflow-testing$' "$service_manifest"
grep -q '^  namespace: agent-workflow-testing$' "$service_manifest"

grep -q '^kind: Namespace$' "$app_dir/namespace.yaml"
grep -q '^kind: Deployment$' "$app_dir/deployment.yaml"
grep -q '^          image: nginx:1.27-alpine$' "$app_dir/deployment.yaml"
grep -q '^kind: Service$' "$app_dir/service.yaml"
grep -q '^  selector:$' "$app_dir/service.yaml"

echo 'Plural GitOps manifests look correct.'
