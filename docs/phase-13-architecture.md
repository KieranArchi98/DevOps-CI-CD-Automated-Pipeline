# Phase 13 Production Hardening - Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         KUBERNETES CLUSTER                          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    INGRESS / LOAD BALANCER                    │  │
│  └────────────────────────┬─────────────────────────────────────┘  │
│                           │                                         │
│  ┌────────────────────────┴─────────────────────────────────────┐  │
│  │                      SERVICE LAYER                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │  │
│  │  │   Backend    │  │   Frontend   │  │    Redis     │       │  │
│  │  │   Service    │  │   Service    │  │   Service    │       │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                           │                                         │
│  ┌────────────────────────┴─────────────────────────────────────┐  │
│  │                      POD LAYER                                │  │
│  │                                                               │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  │  Backend Pod (Stable)                                   │ │  │
│  │  │  ┌────────────────────────────────────────────────────┐ │ │  │
│  │  │  │  Container: llm-backend                            │ │ │  │
│  │  │  │  ┌──────────────────────────────────────────────┐  │ │ │  │
│  │  │  │  │  Health Checks:                              │  │ │ │  │
│  │  │  │  │  • Liveness:  GET /health (every 10s)       │  │ │ │  │
│  │  │  │  │  • Readiness: GET /ready (every 5s)         │  │ │ │  │
│  │  │  │  │                                              │  │ │ │  │
│  │  │  │  │  Graceful Shutdown:                          │  │ │ │  │
│  │  │  │  │  • SIGTERM handler                           │  │ │ │  │
│  │  │  │  │  • preStop: sleep 5                          │  │ │ │  │
│  │  │  │  │  • terminationGracePeriod: 30s               │  │ │ │  │
│  │  │  │  │                                              │  │ │ │  │
│  │  │  │  │  Logging:                                    │  │ │ │  │
│  │  │  │  │  • Structured JSON logs                      │  │ │ │  │
│  │  │  │  │  • Request ID tracking                       │  │ │ │  │
│  │  │  │  │                                              │  │ │ │  │
│  │  │  │  │  Resources:                                  │  │ │ │  │
│  │  │  │  │  • Request: 128Mi / 100m CPU                 │  │ │ │  │
│  │  │  │  │  • Limit:   512Mi / 500m CPU                 │  │ │ │  │
│  │  │  │  │                                              │  │ │ │  │
│  │  │  │  │  Metrics:                                    │  │ │ │  │
│  │  │  │  │  • Prometheus /metrics endpoint              │  │ │ │  │
│  │  │  │  │  • http_requests_total                       │  │ │ │  │
│  │  │  │  │  • http_request_duration_seconds             │  │ │ │  │
│  │  │  │  └──────────────────────────────────────────────┘  │ │ │  │
│  │  │  └────────────────────────────────────────────────────┘ │ │  │
│  │  └─────────────────────────────────────────────────────────┘ │  │
│  │                                                               │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  │  Frontend Pod (Stable)                                  │ │  │
│  │  │  ┌────────────────────────────────────────────────────┐ │ │  │
│  │  │  │  Container: llm-frontend                           │ │ │  │
│  │  │  │  ┌──────────────────────────────────────────────┐  │ │ │  │
│  │  │  │  │  Health Checks:                              │  │ │ │  │
│  │  │  │  │  • Liveness:  GET /api/health (every 10s)   │  │ │ │  │
│  │  │  │  │  • Readiness: GET /api/health (every 5s)    │  │ │ │  │
│  │  │  │  │                                              │  │ │ │  │
│  │  │  │  │  Graceful Shutdown:                          │  │ │ │  │
│  │  │  │  │  • preStop: sleep 5                          │  │ │ │  │
│  │  │  │  │  • terminationGracePeriod: 30s               │  │ │ │  │
│  │  │  │  │                                              │  │ │ │  │
│  │  │  │  │  Resources:                                  │  │ │ │  │
│  │  │  │  │  • Request: 64Mi / 50m CPU                   │  │ │ │  │
│  │  │  │  │  • Limit:   256Mi / 200m CPU                 │  │ │ │  │
│  │  │  │  └──────────────────────────────────────────────┘  │ │ │  │
│  │  │  └────────────────────────────────────────────────────┘ │ │  │
│  │  └─────────────────────────────────────────────────────────┘ │  │
│  │                                                               │  │
│  │  ┌─────────────────────────────────────────────────────────┐ │  │
│  │  │  Worker Pod                                             │ │  │
│  │  │  ┌────────────────────────────────────────────────────┐ │ │  │
│  │  │  │  Container: llm-worker (Celery)                    │ │ │  │
│  │  │  │  ┌──────────────────────────────────────────────┐  │ │ │  │
│  │  │  │  │  Graceful Shutdown:                          │  │ │ │  │
│  │  │  │  │  • preStop: sleep 10 (finish tasks)          │  │ │ │  │
│  │  │  │  │  • terminationGracePeriod: 60s               │  │ │ │  │
│  │  │  │  │                                              │  │ │ │  │
│  │  │  │  │  Resources:                                  │  │ │ │  │
│  │  │  │  │  • Request: 128Mi / 100m CPU                 │  │ │ │  │
│  │  │  │  │  • Limit:   512Mi / 500m CPU                 │  │ │ │  │
│  │  │  │  └──────────────────────────────────────────────┘  │ │ │  │
│  │  │  └────────────────────────────────────────────────────┘ │ │  │
│  │  └─────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    MONITORING LAYER                           │  │
│  │  ┌──────────────┐           ┌──────────────┐                 │  │
│  │  │  Prometheus  │  ────────▶│   Grafana    │                 │  │
│  │  │   (Metrics)  │           │ (Dashboards) │                 │  │
│  │  └──────────────┘           └──────────────┘                 │  │
│  │         │                                                     │  │
│  │         └─────────────────────────────────────────┐           │  │
│  │                                                   │           │  │
│  │  Scrapes metrics from:                            │           │  │
│  │  • /metrics (Backend)                             │           │  │
│  │  • Pod health status                              │           │  │
│  │  • Resource usage                                 │           │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                       REQUEST FLOW WITH PROBES                      │
└─────────────────────────────────────────────────────────────────────┘

1. Kubernetes Liveness Probe (every 10s):
   ┌──────────┐    GET /health     ┌──────────┐
   │ Kubelet  │ ─────────────────▶ │   Pod    │
   └──────────┘ ◀───────────────── └──────────┘
                  200 OK {"status":"ok"}
   
   If fails 3 times → Pod restarted

2. Kubernetes Readiness Probe (every 5s):
   ┌──────────┐    GET /ready      ┌──────────┐
   │ Kubelet  │ ─────────────────▶ │   Pod    │
   └──────────┘ ◀───────────────── └──────────┘
                  200 OK {"status":"ready", "checks":{...}}
   
   If fails 3 times → Pod removed from Service

3. User Request with Structured Logging:
   ┌──────────┐    GET /api/chat   ┌──────────┐
   │  Client  │ ─────────────────▶ │ Backend  │
   └──────────┘                    └──────────┘
                                        │
                                        ▼
                                   Generate UUID
                                   request_id: abc-123
                                        │
                                        ▼
                                   Log (JSON):
                                   {
                                     "timestamp": "...",
                                     "level": "INFO",
                                     "service": "llm-backend",
                                     "request_id": "abc-123",
                                     "message": "Incoming request",
                                     ...
                                   }
                                        │
                                        ▼
   ┌──────────┐ ◀───────────────── Process Request
   │  Client  │   X-Request-ID:    └──────────┘
   └──────────┘   abc-123

4. Graceful Shutdown Flow:
   ┌──────────┐    kubectl delete  ┌──────────┐
   │ Kubectl  │ ─────────────────▶ │   Pod    │
   └──────────┘                    └──────────┘
                                        │
                                        ▼
                                   1. preStop hook
                                      sleep 5
                                        │
                                        ▼
                                   2. SIGTERM sent
                                      to container
                                        │
                                        ▼
                                   3. App receives signal
                                      • Stop accepting new requests
                                      • Complete in-flight requests
                                      • Close connections (Redis, DB)
                                        │
                                        ▼
                                   4. Container exits
                                      (within 30s grace period)
                                        │
                                        ▼
                                   5. Pod terminated

┌─────────────────────────────────────────────────────────────────────┐
│                         ERROR HANDLING FLOW                         │
└─────────────────────────────────────────────────────────────────────┘

   ┌──────────┐    Request        ┌──────────┐
   │  Client  │ ─────────────────▶│ Backend  │
   └──────────┘                   └──────────┘
                                       │
                                       ▼
                                  Exception occurs
                                       │
                                       ▼
                                  Global Exception Handler
                                       │
                                       ├─▶ Log full error (server-side):
                                       │   {
                                       │     "timestamp": "...",
                                       │     "level": "ERROR",
                                       │     "request_id": "abc-123",
                                       │     "exception": {
                                       │       "type": "ValueError",
                                       │       "message": "...",
                                       │       "traceback": [...]
                                       │     }
                                       │   }
                                       │
                                       └─▶ Return sanitized response (client):
   ┌──────────┐ ◀─────────────────     {
   │  Client  │   500 Internal Error    "error": "Internal server error",
   └──────────┘                         "message": "...",
                                        "request_id": "abc-123",
                                        "type": "internal_error"
                                      }
                                      (No stack trace leaked!)
```

## Key Features Illustrated

### 🔍 Health Checks
- **Liveness**: Detects deadlocked/crashed containers → Auto-restart
- **Readiness**: Detects unhealthy dependencies → Remove from load balancer

### 🛑 Graceful Shutdown
- **preStop hook**: Delay to allow load balancer to update
- **SIGTERM handling**: Clean shutdown of connections
- **Grace period**: Time limit for shutdown (30-60s)

### 📊 Structured Logging
- **JSON format**: Easy to parse and aggregate
- **Request ID**: Trace requests across services
- **Context**: Service, timestamp, level, location

### 🔒 Error Handling
- **Server-side**: Full error details logged
- **Client-side**: Sanitized response (no stack traces)
- **Tracing**: Request ID for debugging

### 📈 Monitoring
- **Prometheus**: Scrapes metrics from /metrics
- **Grafana**: Visualizes metrics in dashboards
- **Alerts**: Based on error rate, latency, availability
