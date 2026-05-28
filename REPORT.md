# Plural MCP downloadServiceManifests Tool Report

## Tool Access Verification
The `downloadServiceManifests` tool is accessible and fully functional. It was used to download the rendered Kubernetes manifests for the service **test-example** deployed on cluster **mgmt**.

## Download Details
- **Cluster:** `mgmt`
- **Service:** `test-example`
- **Service ID:** `117c266a-c508-4059-8d23-c0ff6280d3fd`
- **Output Directory:** `/plural/shared/manifests/mgmt-test-example`
- **Total Files:** 2

---

## File Contents

### 1. `my-web-app.yaml`
This file defines a Custom Resource of kind `WebApp`.

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

### 2. `webapp-crd.yaml`
This file contains the CustomResourceDefinition (CRD) for the `WebApp` resource.

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
