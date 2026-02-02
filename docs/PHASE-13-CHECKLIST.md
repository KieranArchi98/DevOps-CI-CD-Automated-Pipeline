# Phase 13 Production Hardening - Verification Checklist

Use this checklist to verify that Phase 13 has been fully implemented and is working correctly.

## ✅ Code Implementation

### Backend

- [ ] **Health endpoint exists** (`GET /health`)
  - File: `backend/app/main.py`
  - Returns: `{"status": "ok", "service": "llm-backend", "timestamp": <time>}`

- [ ] **Readiness endpoint exists** (`GET /ready`)
  - File: `backend/app/main.py`
  - Checks Redis connectivity
  - Returns 200 if ready, 503 if not ready

- [ ] **Structured logging configured**
  - File: `backend/app/core/logging_config.py` exists
  - JSON formatter implemented
  - Logs include: timestamp, level, service, message, request_id

- [ ] **Graceful shutdown handler**
  - File: `backend/app/core/shutdown.py` exists
  - Handles SIGTERM and SIGINT
  - Cleanup callback for Redis

- [ ] **Request ID middleware**
  - File: `backend/app/main.py`
  - Adds UUID to each request
  - Returns `X-Request-ID` header

- [ ] **Global exception handler**
  - File: `backend/app/main.py`
  - Catches all exceptions
  - Returns sanitized error response
  - Logs full error details

### Frontend

- [ ] **Health endpoint exists** (`GET /api/health`)
  - File: `frontend/app/api/health/route.ts` exists
  - Returns: `{"status": "ok", "service": "llm-frontend", "timestamp": <time>}`

## ✅ Kubernetes Manifests

### Backend Deployment (`k8s/backend-deployment.yaml`)

- [ ] **Liveness probe configured**
  - Path: `/health`
  - Port: 8000
  - initialDelaySeconds: 10
  - periodSeconds: 10

- [ ] **Readiness probe configured**
  - Path: `/ready`
  - Port: 8000
  - initialDelaySeconds: 5
  - periodSeconds: 5

- [ ] **Graceful shutdown configured**
  - `terminationGracePeriodSeconds: 30`
  - preStop hook: `sleep 5`

- [ ] **Resource limits set**
  - Requests: 128Mi / 100m CPU
  - Limits: 512Mi / 500m CPU

- [ ] **Environment variables**
  - `LOG_LEVEL: INFO`

### Backend Canary Deployment (`k8s/backend-canary-deployment.yaml`)

- [ ] **Liveness probe configured**
- [ ] **Readiness probe configured**
- [ ] **Graceful shutdown configured**
- [ ] **Resource limits set**
- [ ] **Environment variables**

### Frontend Deployment (`k8s/frontend-deployment.yaml`)

- [ ] **Liveness probe configured**
  - Path: `/api/health`
  - Port: 80
  - initialDelaySeconds: 10
  - periodSeconds: 10

- [ ] **Readiness probe configured**
  - Path: `/api/health`
  - Port: 80
  - initialDelaySeconds: 5
  - periodSeconds: 5

- [ ] **Graceful shutdown configured**
  - `terminationGracePeriodSeconds: 30`
  - preStop hook: `sleep 5`

- [ ] **Resource limits set**
  - Requests: 64Mi / 50m CPU
  - Limits: 256Mi / 200m CPU

- [ ] **Environment variables**
  - `NODE_ENV: production`

### Frontend Canary Deployment (`k8s/frontend-canary-deployment.yaml`)

- [ ] **Liveness probe configured**
- [ ] **Readiness probe configured**
- [ ] **Graceful shutdown configured**
- [ ] **Resource limits set**
- [ ] **Environment variables**

### Worker Deployment (`k8s/worker-deployment.yaml`)

- [ ] **Graceful shutdown configured**
  - `terminationGracePeriodSeconds: 60`
  - preStop hook: `sleep 10`

- [ ] **Resource limits set**
  - Requests: 128Mi / 100m CPU
  - Limits: 512Mi / 500m CPU

- [ ] **Environment variables**
  - `LOG_LEVEL: INFO`

## ✅ Scripts & Documentation

- [ ] **Health validation script exists**
  - File: `scripts/validate-health-endpoints.sh`

- [ ] **Local testing script exists**
  - File: `scripts/test-phase-13.sh`

- [ ] **Full documentation exists**
  - File: `docs/phase-13-production-hardening.md`

- [ ] **Quick reference exists**
  - File: `docs/PHASE-13-SUMMARY.md`

- [ ] **Architecture diagram exists**
  - File: `docs/phase-13-architecture.md`

- [ ] **Implementation summary exists**
  - File: `PHASE-13-IMPLEMENTATION.md`

## ✅ Local Testing

### Backend Tests

- [ ] **Start backend successfully**
  ```bash
  cd backend
  uvicorn app.main:app --reload
  ```

- [ ] **Health endpoint responds**
  ```bash
  curl http://localhost:8000/health
  # Expected: {"status":"ok","service":"llm-backend","timestamp":...}
  ```

- [ ] **Readiness endpoint responds**
  ```bash
  curl http://localhost:8000/ready
  # Expected: {"status":"ready","checks":{...},"timestamp":...}
  # Or 503 if Redis not available
  ```

- [ ] **Structured logs visible**
  - Start backend
  - Make a request
  - Observe JSON-formatted logs in console
  - Verify fields: timestamp, level, service, request_id, message

- [ ] **Request ID in response**
  ```bash
  curl -i http://localhost:8000/health | grep -i x-request-id
  # Expected: X-Request-ID: <uuid>
  ```

- [ ] **Graceful shutdown works**
  - Start backend
  - Press Ctrl+C
  - Observe "Graceful shutdown" messages in logs
  - Verify Redis connection closed

- [ ] **Prometheus metrics exposed**
  ```bash
  curl http://localhost:8000/metrics | grep http_requests_total
  # Expected: Prometheus metrics output
  ```

### Frontend Tests

- [ ] **Start frontend successfully**
  ```bash
  cd frontend
  npm run dev
  ```

- [ ] **Health endpoint responds**
  ```bash
  curl http://localhost:3000/api/health
  # Expected: {"status":"ok","service":"llm-frontend","timestamp":...}
  ```

## ✅ Kubernetes Testing

### Deployment

- [ ] **Deploy backend successfully**
  ```bash
  export IMAGE_TAG=latest
  envsubst < k8s/backend-deployment.yaml | kubectl apply -f -
  ```

- [ ] **Deploy frontend successfully**
  ```bash
  envsubst < k8s/frontend-deployment.yaml | kubectl apply -f -
  ```

- [ ] **Deploy worker successfully**
  ```bash
  envsubst < k8s/worker-deployment.yaml | kubectl apply -f -
  ```

### Pod Health

- [ ] **Pods are running**
  ```bash
  kubectl get pods
  # All pods should be Running with READY 1/1
  ```

- [ ] **Liveness probes passing**
  ```bash
  kubectl describe pod <backend-pod-name> | grep -A5 "Liveness"
  # Should show successful probe results
  ```

- [ ] **Readiness probes passing**
  ```bash
  kubectl describe pod <backend-pod-name> | grep -A5 "Readiness"
  # Should show successful probe results
  ```

### Graceful Shutdown

- [ ] **Graceful shutdown works in K8s**
  ```bash
  # Watch logs
  kubectl logs -f <pod-name> &
  
  # Delete pod
  kubectl delete pod <pod-name>
  
  # Observe:
  # 1. preStop hook executes (5-10s delay)
  # 2. SIGTERM received
  # 3. Graceful shutdown logs
  # 4. Redis connection closed
  # 5. Pod terminates within grace period
  ```

### Logs

- [ ] **Structured logs in Kubernetes**
  ```bash
  kubectl logs <backend-pod-name> | head -n 10
  # Should show JSON-formatted logs
  ```

- [ ] **Request ID in logs**
  ```bash
  kubectl logs <backend-pod-name> | grep request_id
  # Should show request_id field in logs
  ```

## ✅ Monitoring

- [ ] **Prometheus scraping metrics**
  ```bash
  # Port-forward to Prometheus
  kubectl port-forward svc/prometheus-service 9090:9090
  
  # Check targets
  # Open: http://localhost:9090/targets
  # Verify backend and frontend targets are UP
  ```

- [ ] **Metrics available in Prometheus**
  ```promql
  # Query in Prometheus UI:
  http_requests_total
  http_request_duration_seconds
  ```

- [ ] **Grafana dashboards showing data**
  ```bash
  # Port-forward to Grafana
  kubectl port-forward svc/grafana-service 3000:80
  
  # Open: http://localhost:3000
  # Verify dashboards show request rate, latency, errors
  ```

## ✅ Error Handling

- [ ] **Global exception handler works**
  ```bash
  # Trigger an error (e.g., invalid endpoint)
  curl http://localhost:8000/api/invalid-endpoint
  
  # Expected response:
  # {
  #   "error": "Internal server error",
  #   "message": "...",
  #   "request_id": "<uuid>",
  #   "type": "internal_error"
  # }
  
  # Check logs for full error details
  ```

- [ ] **No stack traces leaked to client**
  - Make request that causes error
  - Verify response does not contain stack trace
  - Verify logs contain full stack trace

## ✅ CI/CD Integration

- [ ] **Health validation script runs**
  ```bash
  chmod +x scripts/validate-health-endpoints.sh
  ./scripts/validate-health-endpoints.sh
  # Should pass all checks
  ```

- [ ] **CI pipeline includes health checks** (Optional)
  - Add validation step to `.github/workflows/ci-cd.yml`
  - Verify pipeline fails if health endpoints missing

## 📊 Final Verification

Run this command to verify everything:

```bash
# Run comprehensive test
chmod +x scripts/test-phase-13.sh
./scripts/test-phase-13.sh

# Expected: All tests pass ✓
```

## ✅ Sign-Off

Once all items are checked:

- [ ] **All backend features implemented**
- [ ] **All frontend features implemented**
- [ ] **All Kubernetes manifests updated**
- [ ] **Local testing passed**
- [ ] **Kubernetes testing passed**
- [ ] **Monitoring verified**
- [ ] **Documentation complete**

**Phase 13 Production Hardening: COMPLETE** ✅

---

## 🚀 Next Steps

After verification:

1. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: implement Phase 13 - Production Hardening"
   git push origin main
   ```

2. **Deploy to production**
   - CI/CD pipeline will automatically deploy
   - Canary deployment will validate metrics
   - Promote to stable after validation

3. **Monitor in production**
   - Watch Grafana dashboards
   - Set up alerts for error rate, latency
   - Monitor pod health and restarts

4. **Move to Phase 14**
   - Infrastructure as Code with Terraform
   - Automated cluster provisioning
   - Cloud provider integration
