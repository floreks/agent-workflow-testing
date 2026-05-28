# MCP downloadServiceManifests report

## Request

- Tool: `plural_downloadServiceManifests`
- Cluster: `mgmt`
- Service: `test-example`

## Tool result

```json
{
  "success": true,
  "message": "downloaded manifests for service \"test-example\" on cluster \"mgmt\"",
  "cluster": "mgmt",
  "service": "test-example",
  "serviceId": "117c266a-c508-4059-8d23-c0ff6280d3fd",
  "directory": "/plural/shared/manifests/mgmt-test-example",
  "fileCount": 2,
  "instructions": "The rendered Kubernetes manifests for the service have been written to \"/plural/shared/manifests/mgmt-test-example\". Use Read/Glob/Grep against this directory to inspect the actual resources Plural is applying (including resources rendered from external Helm charts) instead of guessing via web searches."
}
```

## Downloaded files

Directory: `/plural/shared/manifests/mgmt-test-example`

- `my-web-app.yaml`
- `webapp-crd.yaml`

## File contents (excerpt)

`my-web-app.yaml`:

```yaml
apiVersion: example.com/v1
kind: WebApp
metadata:
  name: my-web-app
  namespace: default
spec:
  image: nginx:1.21
  replicas: 3
  port: 80
```

`webapp-crd.yaml`:

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: webapps.example.com
spec:
  group: example.com
  scope: Namespaced
  names:
    plural: webapps
    singular: webapp
    kind: WebApp
```
