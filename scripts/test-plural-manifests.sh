#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

required_files=(
  manifests/README.md
  manifests/plural/git-repository.yaml
  manifests/plural/service-deployment.yaml
  manifests/app/namespace.yaml
  manifests/app/deployment.yaml
  manifests/app/service.yaml
)

for file in "${required_files[@]}"; do
  [[ -f "$file" ]] || {
    echo "missing required file: $file" >&2
    exit 1
  }
done

grep -Eq '^kind:[[:space:]]*GitRepository$' manifests/plural/git-repository.yaml
grep -Eq '^spec:$' -A3 manifests/plural/git-repository.yaml >/dev/null
grep -Eq 'url:[[:space:]]*https://github.com/floreks/agent-workflow-testing.git$' manifests/plural/git-repository.yaml

grep -Eq '^kind:[[:space:]]*ServiceDeployment$' manifests/plural/service-deployment.yaml
grep -Eq 'cluster:[[:space:]]*mgmt$' manifests/plural/service-deployment.yaml
grep -Eq 'ref:[[:space:]]*master$' manifests/plural/service-deployment.yaml
grep -Eq 'folder:[[:space:]]*manifests/app$' manifests/plural/service-deployment.yaml

grep -Eq '^kind:[[:space:]]*Namespace$' manifests/app/namespace.yaml
grep -Eq '^kind:[[:space:]]*Deployment$' manifests/app/deployment.yaml
grep -Eq 'image:[[:space:]]*nginx:1.27.5-alpine$' manifests/app/deployment.yaml
grep -Eq '^kind:[[:space:]]*Service$' manifests/app/service.yaml
grep -Eq 'targetPort:[[:space:]]*80$' manifests/app/service.yaml

echo 'Plural manifest validation passed.'
