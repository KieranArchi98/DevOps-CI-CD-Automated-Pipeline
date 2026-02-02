# Phase 13 — Production Hardening

## Overview

Phase 13 implements production-grade hardening across the entire stack to ensure resilience, observability, and professional deployment practices.

## What Was Implemented

### 1. Health & Readiness Endpoints

#### Backend (`/health` and `/ready`)
- **`/health`** - Liveness probe endpoint
  - Simple check that the process is running
  - Returns: `{"status": "ok", "service": "llm-backend", "timestamp": <unix_time>}`
  
- **`/ready`** - Readiness probe endpoint
  - Checks Redis connectivity
  - Checks database connectivity (if applicable)
  - Returns 200 if ready, 503 if not ready
  - Response includes health check details for each dependency

#### Frontend (`/api/health`)
- **`/api/health`** - Liveness probe endpoint
  - Simple check that Next.js is running
  - Returns: `{"status": "ok", "service": "llm-frontend", "timestamp": <unix_time>}`

### 2. Kubernetes Probes

All deployments now include:

#### Liveness Probes
- Auto-restart containers that become unresponsive
- Configuration:
  - `initialDelaySeconds: 10` - Wait 10s after container start
  - `periodSeconds: 10` - Check every 10s
  - `timeoutSeconds: 5` - 5s timeout per check
  - `failureThreshold: 3` - Restart after 3 consecutive failures

#### Readiness Probes
- Remove pods from service load balancing when not ready
- Configuration:
  - `initialDelaySeconds: 5` - Wait 5s after container start
  - `periodSeconds: 5` - Check every 5s
  - `timeoutSeconds: 3` - 3s timeout per check
  - `failureThreshold: 3` - Mark unready after 3 consecutive failures

### 3. Graceful Shutdown

#### Backend
- **Signal Handling**: Handles SIGTERM and SIGINT signals
- **Cleanup**: Closes Redis connections and completes in-flight requests
- **Timeout**: 30 seconds termination grace period
- **Implementation**: `app/core/shutdown.py` - GracefulShutdown class

#### Frontend
- **Timeout**: 30 seconds termination grace period
- **Clean shutdown**: Ensures Node.js process terminates cleanly

#### Worker
- **Extended timeout**: 60 seconds to allow background tasks to complete
- **PreStop hook**: 10-second delay to finish current tasks

#### Kubernetes Configuration
All deployments include:
- `terminationGracePeriodSeconds`: 30-60 seconds
- `preStop` hook: Short delay (5-10s) to allow graceful connection draining

### 4. Structured Logging

#### Backend Implementation
- **JSON Logs**: All logs output in structured JSON format
- **Fields Included**:
  - `timestamp`: ISO 8601 UTC timestamp
  - `level`: Log level (INFO, WARNING, ERROR, etc.)
  - `service`: Service name (llm-backend)
  - `logger`: Logger name
  - `message`: Log message
  - `request_id`: Unique request identifier for tracing
  - `location`: File, line, and function information
  - `exception`: Full exception details (type, message, traceback)

- **Request ID Middleware**: Adds unique UUID to each request
  - Included in all logs for that request
  - Returned in `X-Request-ID` response header
  - Enables distributed tracing

- **Implementation**: `app/core/logging_config.py`

#### Frontend
- Environment-aware console logging
- Production mode suppresses verbose logs

### 5. Error Handling

#### Global Exception Handler
- **Consistent Error Format**: All errors return standardized JSON
- **Security**: No stack traces leaked to clients in production
- **Logging**: Full error details logged server-side with request context
- **Response Format**:
  ```json
  {
    "error": "Internal server error",
    "message": "An unexpected error occurred. Please try again later.",
    "request_id": "<uuid>",
    "type": "internal_error"
  }
  ```

### 6. Resource Management

All deployments include realistic resource limits:

#### Backend & Worker
- **Requests**: 128Mi memory, 100m CPU
- **Limits**: 512Mi memory, 500m CPU

#### Frontend
- **Requests**: 64Mi memory, 50m CPU
- **Limits**: 256Mi memory, 200m CPU

### 7. Alerting Readiness

Metrics exposed for monitoring and alerting:

#### Prometheus Metrics
- `http_requests_total` - Total HTTP requests by method, endpoint, status
- `http_request_duration_seconds` - Request latency histogram
- All metrics include labels for filtering and aggregation

#### Suitable for Alerts
- Error rate: `rate(http_requests_total{status=~"5.."}[5m])`
- Latency: `histogram_quantile(0.95, http_request_duration_seconds)`
- Request count: `rate(http_requests_total[5m])`

### 8. CI/CD Validation

#### Health Endpoint Validation Script
- `scripts/validate-health-endpoints.sh`
- Validates all health endpoints return expected responses
- Checks JSON response structure
- Can be integrated into CI pipeline

## Files Modified

### Backend
- `backend/app/main.py` - Added health/ready endpoints, structured logging, graceful shutdown, global exception handler
- `backend/app/core/logging_config.py` - **NEW** - Structured JSON logging configuration
- `backend/app/core/shutdown.py` - **NEW** - Graceful shutdown handler

### Frontend
- `frontend/app/api/health/route.ts` - **NEW** - Health endpoint

### Kubernetes Manifests
- `k8s/backend-deployment.yaml` - Added probes, graceful shutdown, LOG_LEVEL env
- `k8s/backend-canary-deployment.yaml` - Added probes, resources, graceful shutdown
- `k8s/frontend-deployment.yaml` - Added probes, graceful shutdown, NODE_ENV
- `k8s/frontend-canary-deployment.yaml` - Added probes, resources, graceful shutdown
- `k8s/worker-deployment.yaml` - Added graceful shutdown, LOG_LEVEL env

### Scripts
- `scripts/validate-health-endpoints.sh` - **NEW** - Health endpoint validation

## Testing Locally

### 1. Test Backend Health Endpoints

```bash
# Start backend
cd backend
uvicorn app.main:app --reload

# Test health endpoint
curl http://localhost:8000/health

# Test readiness endpoint (requires Redis)
curl http://localhost:8000/ready
```

### 2. Test Frontend Health Endpoint

```bash
# Start frontend
cd frontend
npm run dev

# Test health endpoint
curl http://localhost:3000/api/health
```

### 3. Test Graceful Shutdown

```bash
# Start backend
uvicorn app.main:app

# Send SIGTERM (Ctrl+C or kill -TERM <pid>)
# Observe logs showing graceful shutdown
```

### 4. Test Structured Logging

```bash
# Start backend and make requests
# Observe JSON-formatted logs with request IDs

# Example log output:
# {"timestamp": "2026-02-02T12:00:00Z", "level": "INFO", "service": "llm-backend", ...}
```

## Kubernetes Deployment

### Apply Updated Manifests

```bash
# Set your image tag
export IMAGE_TAG=latest

# Apply backend
envsubst < k8s/backend-deployment.yaml | kubectl apply -f -

# Apply frontend
envsubst < k8s/frontend-deployment.yaml | kubectl apply -f -

# Apply worker
envsubst < k8s/worker-deployment.yaml | kubectl apply -f -
```

### Verify Probes

```bash
# Check pod status
kubectl get pods

# Describe pod to see probe status
kubectl describe pod <pod-name>

# Check events for probe failures
kubectl get events --sort-by='.lastTimestamp'
```

### Test Graceful Shutdown

```bash
# Delete a pod and watch logs
kubectl logs -f <pod-name> &
kubectl delete pod <pod-name>

# Observe graceful shutdown logs
```

## Monitoring & Alerting

### Prometheus Queries for Alerts

```promql
# High error rate (>5% of requests failing)
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05

# High latency (95th percentile >1s)
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1

# Low request rate (possible outage)
rate(http_requests_total[5m]) < 0.1
```

### Grafana Dashboards

Monitor:
- Request rate by endpoint
- Error rate by status code
- Latency percentiles (p50, p95, p99)
- Pod restarts (liveness probe failures)
- Pod readiness status

## Security Considerations

1. **No Stack Traces**: Global exception handler prevents leaking internal details
2. **Structured Logging**: Sensitive data can be filtered/redacted in logging config
3. **Request Tracing**: Request IDs enable security incident investigation
4. **Resource Limits**: Prevent resource exhaustion attacks

## Next Steps

### Phase 14 - Infrastructure as Code (IaC)
- Terraform manifests for full infrastructure
- Automated cluster provisioning
- Secrets management with cloud providers

### Optional Enhancements
- **Distributed Tracing**: Add OpenTelemetry for cross-service tracing
- **Log Aggregation**: Ship logs to ELK/Loki for centralized analysis
- **Advanced Alerts**: Slack/Email integration for critical alerts
- **SLO/SLA Monitoring**: Define and track service level objectives

## Troubleshooting

### Pods Not Ready
```bash
# Check readiness probe
kubectl describe pod <pod-name>

# Check logs
kubectl logs <pod-name>

# Common issues:
# - Redis not available
# - Database connection failed
# - Application startup error
```

### Liveness Probe Failures
```bash
# Check if health endpoint is accessible
kubectl exec <pod-name> -- curl localhost:8000/health

# Check application logs
kubectl logs <pod-name>

# Common issues:
# - Application deadlock
# - Memory exhaustion
# - Unhandled exception in health check
```

### Graceful Shutdown Not Working
```bash
# Check terminationGracePeriodSeconds
kubectl get pod <pod-name> -o yaml | grep terminationGracePeriodSeconds

# Check preStop hook
kubectl get pod <pod-name> -o yaml | grep -A5 preStop

# Verify signal handling in logs
kubectl logs <pod-name>
```

## References

- [Kubernetes Liveness and Readiness Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Graceful Shutdown in Kubernetes](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination)
- [Structured Logging Best Practices](https://www.structlog.org/en/stable/)
- [Prometheus Alerting](https://prometheus.io/docs/alerting/latest/overview/)
