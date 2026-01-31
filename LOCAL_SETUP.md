# Local Kubernetes Setup Guide

This guide will help you run the Genesis AI Chatbot locally using **Minikube** and **Kubernetes**, including monitoring with **Prometheus** and **Grafana**.

## 1. Prerequisites

Ensure you have the following installed:
- **Docker Desktop**: [Install](https://www.docker.com/products/docker-desktop/)
- **Minikube**: [Install](https://minikube.sigs.k8s.io/docs/start/)
- **kubectl**: [Install](https://kubernetes.io/docs/tasks/tools/)

## 2. Start Minikube

Start your local Kubernetes cluster:

```bash
minikube start
```

## 3. Configure Secrets

### A. GHCR Authentication (Image Pull Secret)
To pull images from the GitHub Container Registry (GHCR), you need a Personal Access Token (PAT) with `read:packages` scope.

1.  Create a PAT on GitHub (Settings -> Developer Settings -> Tokens).
2.  Run the following command (replace `<YOUR_USERNAME>` and `<YOUR_TOKEN>`):

```bash
kubectl create secret docker-registry ghcr-secret \
  --docker-server=ghcr.io \
  --docker-username=<YOUR_USERNAME> \
  --docker-password=<YOUR_TOKEN> \
  --docker-email=<YOUR_EMAIL>
```

### B. Application Secrets
Create the `app-secrets` used by the backend:

```bash
kubectl create secret generic app-secrets \
  --from-literal=OPENAI_API_KEY=sk-your-openai-key-here \
  --from-literal=MONGO_URI=mongodb+srv://your-mongo-uri \
  --from-literal=MONGO_DB=genesis-db
```

## 4. Deploy Monitoring Stack

Deploy Prometheus and Grafana:

```bash
kubectl apply -f k8s/monitoring/
```

Verify they are running:
```bash
kubectl get pods
# Wait until prometheus and grafana pods are 'Running'
```

## 5. Deploy Application

Deploy the backend and frontend (Stable + Canary versions):

```bash
kubectl apply -f k8s/
```

This commands applies:
- `backend-deployment.yaml` (Stable)
- `backend-canary-deployment.yaml` (Canary)
- `frontend-deployment.yaml` (Stable)
- `frontend-canary-deployment.yaml` (Canary)
- Services (`llm-backend`, `llm-frontend`)

## 6. Access the Application

### Frontend
Since we are using Minikube, we access the `LoadBalancer` service via a special command:

```bash
minikube service llm-frontend
```
*This will open your browser to the running frontend.*

### Backend API
To access the backend directly (optional):

```bash
minikube service llm-backend
```

## 7. Access Monitoring Dashboards

### Prometheus
Data source for metrics.

```bash
minikube service prometheus-service
```
*Port 9090 by default.*

### Grafana
Visualization dashboard.

```bash
minikube service grafana-service
```
*Port 3000 by default. Default login is usually admin/admin (or check your grafana.yaml).*

### Verify Metrics
In Grafana, add Prometheus as a data source using the internal cluster URL:
`http://prometheus-service:9090`

Import a dashboard (ID `3662` is good for Prometheus 2.0 Overview) to see metrics from your pods.

## 8. Cleanup

To stop and delete the local cluster:

```bash
minikube stop
minikube delete
```
