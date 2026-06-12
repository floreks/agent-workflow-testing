#!/usr/bin/env bash
set -euo pipefail

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root_dir"

yq_image="mikefarah/yq:4.44.3"

yq_eval() {
  docker run --rm -v "$root_dir:/work" -w /work "$yq_image" e "$1" "$2"
}

for file in manifests/gitrepository.yaml manifests/service-deployment.yaml manifests/app/namespace.yaml manifests/app/configmap.yaml manifests/app/deployment.yaml manifests/app/service.yaml; do
  [[ -f "$file" ]] || {
    echo "missing required manifest: $file" >&2
    exit 1
  }
done

[[ "$(yq_eval '.kind' manifests/gitrepository.yaml)" == "GitRepository" ]]
[[ "$(yq_eval '.spec.url' manifests/gitrepository.yaml)" == "https://github.com/floreks/agent-workflow-testing.git" ]]
[[ "$(yq_eval '.kind' manifests/service-deployment.yaml)" == "ServiceDeployment" ]]
[[ "$(yq_eval '.spec.cluster' manifests/service-deployment.yaml)" == "mgmt" ]]
[[ "$(yq_eval '.spec.repositoryRef.name' manifests/service-deployment.yaml)" == "agent-workflow-testing" ]]
[[ "$(yq_eval '.spec.git.folder' manifests/service-deployment.yaml)" == "manifests/app" ]]
[[ "$(yq_eval '.kind' manifests/app/namespace.yaml)" == "Namespace" ]]
[[ "$(yq_eval '.kind' manifests/app/configmap.yaml)" == "ConfigMap" ]]
[[ "$(yq_eval '.kind' manifests/app/deployment.yaml)" == "Deployment" ]]
[[ "$(yq_eval '.spec.template.spec.containers[0].image' manifests/app/deployment.yaml)" == "nginx:1.27" ]]
[[ "$(yq_eval '.kind' manifests/app/service.yaml)" == "Service" ]]
[[ "$(yq_eval '.spec.ports[0].targetPort' manifests/app/service.yaml)" == "80" ]]

echo 'Plural GitOps manifests validated successfully.'
