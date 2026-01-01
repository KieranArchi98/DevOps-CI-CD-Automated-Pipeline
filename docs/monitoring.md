# Monitoring & Observability

This guide explains how to deploy and access the monitoring stack (Prometheus and Grafana) for the Genesis AI Chatbot.

## 🚀 Deployment

To deploy Prometheus and Grafana to your Kubernetes cluster, run:

```bash
kubectl apply -f k8s/monitoring/
```

## 📊 Accessing Dashboards

Since the services are deployed as `ClusterIP`, you'll need to use port-forwarding to access them locally.

### Prometheus

To access the Prometheus UI (queries, targets, etc.):

```bash
kubectl port-forward service/prometheus-service 9090:9090
```

Open [http://localhost:9090](http://localhost:9090) in your browser.

### Grafana

To access Grafana dashboards:

```bash
kubectl port-forward service/grafana-service 3000:3000
```

Open [http://localhost:3000](http://localhost:3000) (User: `admin`, Password: `admin`).

## ⚙️ Configuration

### Prometheus Data Source in Grafana

1. Log in to Grafana.
2. Go to **Connections > Data Sources**.
3. Add **Prometheus**.
4. Set the URL to: `http://prometheus-service:9090`.

### Backend Metrics

The backend exposes metrics at `/metrics`. Prometheus is configured to scrape this endpoint automatically via the `backend-service`.
