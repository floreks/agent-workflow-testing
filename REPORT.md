# Service Manifests Report: `mgmt/test-example`

## MCP Tool Access

The `downloadServiceManifests` MCP tool is **available and functional**.

## Download Details

| Field        | Value                                              |
|--------------|----------------------------------------------------|
| Cluster      | `mgmt`                                             |
| Service      | `test-example`                                     |
| Service ID   | `117c266a-c508-4059-8d23-c0ff6280d3fd`             |
| Directory    | `/plural/shared/manifests/mgmt-test-example`       |
| File Count   | 2                                                  |

---

## Manifest Files

### 1. `my-web-app.yaml`

A custom `WebApp` resource (CRD instance) deployed to the `default` namespace.

```yaml
apiVersion: example.com/v1
kind: WebApp
metadata:
  name: my-web-app
  namespace: default
  labels:
    app: my-web-app
    version: v1.0.0
spec:
  image: nginx:1.21
  replicas: 3
  port: 80
  environment:
  - name: ENV
    value: production
  - name: LOG_LEVEL
    value: info
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 500m
      memory: 512Mi
status:
  phase: Running
  message: "WebApp is running successfully"
  readyReplicas: 3
```

**Summary:**

| Field           | Value             |
|-----------------|-------------------|
| Kind            | `WebApp`          |
| API Version     | `example.com/v1`  |
| Namespace       | `default`         |
| Image           | `nginx:1.21`      |
| Replicas        | `3` (all ready)   |
| Port            | `80`              |
| Environment     | `ENV=production`, `LOG_LEVEL=info` |
| CPU Request     | `100m`            |
| CPU Limit       | `500m`            |
| Memory Request  | `128Mi`           |
| Memory Limit    | `512Mi`           |
| Status Phase    | `Running`         |

---

### 2. `webapp-crd.yaml`

A `CustomResourceDefinition` (CRD) defining the `WebApp` resource type used above.

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: webapps.example.com
  labels:
    app: webapp-crd
spec:
  group: example.com
  versions:
  - name: v1
    served: true
    storage: true
    schema:
      openAPIV3Schema:
        type: object
        properties:
          spec:
            type: object
            properties:
              image:
                type: string
                description: "Container image for the web application"
              replicas:
                type: integer
                minimum: 1
                maximum: 10
                description: "Number of replicas"
              port:
                type: integer
                minimum: 1
                maximum: 65535
                description: "Port the application listens on"
              environment:
                type: array
                items:
                  type: object
                  properties:
                    name:
                      type: string
                    value:
                      type: string
                  required:
                  - name
                  - value
                description: "Environment variables"
              resources:
                type: object
                properties:
                  requests:
                    type: object
                    properties:
                      cpu:
                        type: string
                      memory:
                        type: string
                  limits:
                    type: object
                    properties:
                      cpu:
                        type: string
                      memory:
                        type: string
            required:
            - image
            - replicas
            - port
          status:
            type: object
            properties:
              phase:
                type: string
                enum: ["Pending", "Running", "Failed"]
              message:
                type: string
              readyReplicas:
                type: integer
    additionalPrinterColumns:
    - name: Image
      type: string
      jsonPath: .spec.image
    - name: Replicas
      type: integer
      jsonPath: .spec.replicas
    - name: Port
      type: integer
      jsonPath: .spec.port
    - name: Status
      type: string
      jsonPath: .status.phase
    - name: Age
      type: date
      jsonPath: .metadata.creationTimestamp
  scope: Namespaced
  names:
    plural: webapps
    singular: webapp
    kind: WebApp
    shortNames:
    - wa
```

**Summary:**

| Field          | Value                          |
|----------------|--------------------------------|
| Kind           | `CustomResourceDefinition`     |
| CRD Name       | `webapps.example.com`          |
| Group          | `example.com`                  |
| Version        | `v1` (served & stored)         |
| Scope          | `Namespaced`                   |
| Short Name     | `wa`                           |
| Required Fields | `image`, `replicas`, `port`   |
| Status Phases  | `Pending`, `Running`, `Failed` |

---

## Observations

- The `mcp__plural__downloadServiceManifests` tool is **accessible** and returned a successful response.
- The `test-example` service on the `mgmt` cluster ships **2 Kubernetes manifests**:
  1. A CRD definition (`webapp-crd.yaml`) that registers the `WebApp` custom resource type under `example.com/v1`.
  2. A CRD instance (`my-web-app.yaml`) creating a `WebApp` running `nginx:1.21` with 3 replicas in the `default` namespace.
- The application is currently in **Running** state with all 3 replicas ready.
- Resource limits are conservatively set (CPU: 100m–500m, Memory: 128Mi–512Mi).
