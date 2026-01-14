# Phase 11 — Progressive Delivery with Blue/Green Deployments

## Overview

Phase 11 implements progressive delivery using Blue/Green deployment strategy with canary releases. Deployments are automatically validated using Prometheus metrics before being promoted to production, enabling zero-downtime releases with instant rollback capability.

## Architecture

### Blue/Green Deployment Model

```
┌─────────────────────────────────────────────────────────────┐
│                         Nginx Proxy                          │
│                    (Traffic Router)                          │
└────────────┬──────────────────────────┬─────────────────────┘
             │                          │
    ┌────────▼────────┐        ┌───────▼─────────┐
    │   Blue Slot     │        │   Green Slot    │
    │  (Production)   │        │    (Canary)     │
    ├─────────────────┤        ├─────────────────┤
    │ Backend Blue    │        │ Backend Green   │
    │ Frontend Blue   │        │ Frontend Green  │
    └─────────────────┘        └─────────────────┘
             │                          │
             └──────────┬───────────────┘
                        │
              ┌─────────▼──────────┐
              │  Shared Services   │
              │  - Redis           │
              │  - MongoDB         │
              │  - Prometheus      │
              │  - Grafana         │
              └────────────────────┘
```

**Key Components:**

- **Blue Slot**: Currently active production deployment
- **Green Slot**: Inactive slot used for canary deployments
- **Nginx**: Reverse proxy routing traffic to active slot
- **Shared Services**: Redis, MongoDB, Prometheus, Grafana (shared across both slots)

---

## Deployment Workflow

### 1. Canary Deployment

When code is pushed to `main` or `develop`:

1. **Build & Test**: Code is linted, tested, and scanned for vulnerabilities
2. **Build & Push**: Docker images tagged with Git SHA and `latest`
3. **Deploy Canary**:
   - Determine inactive slot (if blue is active, deploy to green)
   - Pull versioned images (`${{ github.sha }}`)
   - Deploy to canary slot
   - Wait for health checks to pass
4. **Validate Metrics**:
   - Generate test traffic to canary
   - Wait for Prometheus to scrape metrics
   - Run `check-canary-metrics.sh` script
   - Compare canary vs production metrics
   - Fail if thresholds exceeded

### 2. Production Promotion

After canary validation passes:

1. **Manual Approval**: Requires approval in GitHub Actions (production environment)
2. **Traffic Switch**:
   - Run `switch-traffic.sh` to update Nginx configuration
   - Reload Nginx to route traffic to new slot
   - Verify traffic is flowing correctly
3. **Monitor Production**:
   - Monitor metrics for 5 minutes
   - Auto-rollback if error rate exceeds 5%
   - Mark deployment successful if stable

### 3. Rollback

If issues are detected:

1. **Automatic Rollback**: Triggered if production metrics degrade
2. **Manual Rollback**: Via GitHub Actions workflow dispatch
3. **Process**:
   - Run `switch-traffic.sh` with previous slot
   - Traffic instantly switches back
   - Verify rollback successful

---

## Metrics Validation Criteria

### Canary Thresholds

| Metric           | Absolute Threshold | Production Comparison |
| ---------------- | ------------------ | --------------------- |
| **Error Rate**   | < 5%               | Not > 2x production   |
| **P95 Latency**  | < 2.0 seconds      | Not > 1.5x production |
| **Availability** | 100% health checks | Must pass all checks  |

### Validation Logic

The `check-canary-metrics.sh` script validates:

1. **Availability**: Canary must be `up` in Prometheus
2. **Error Rate**:
   - Query: `rate(http_requests_total{status=~"5.."}[2m]) / rate(http_requests_total[2m])`
   - Must be < 5%
   - Must not exceed 2x production error rate
3. **Latency**:
   - Query: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[2m]))`
   - Must be < 2.0 seconds
   - Must not exceed 1.5x production latency

---

## Local Testing

### Prerequisites

```bash
# Ensure you have the required environment variables
cp .env.dev .env.blue
cp .env.dev .env.green

# Update .env.blue and .env.green with your credentials
```

### Start Blue/Green Deployment

```bash
# Start with blue slot active
ACTIVE_SLOT=blue docker-compose -f docker-compose.blue-green.yml up -d

# Verify services are running
docker ps

# Check active slot
curl http://localhost:8081/active-slot
# Should return: blue

# Access application
curl http://localhost:8080/health
# Traffic is routed through Nginx to blue backend
```

### Deploy to Green Slot (Canary)

```bash
# Deploy to green slot
BACKEND_VERSION=latest FRONTEND_VERSION=latest \
  docker-compose -f docker-compose.blue-green.yml up -d backend-green frontend-green

# Wait for green to be healthy
docker ps --filter "name=llm-backend-green"

# Check health directly
docker exec llm-backend-green curl http://localhost:8000/health
```

### Validate Canary Metrics

```bash
# Generate traffic to green slot
for i in {1..50}; do
  docker exec llm-nginx curl -sf http://backend-green:8000/health > /dev/null
done

# Wait for Prometheus to scrape
sleep 20

# Run metrics validation
chmod +x scripts/check-canary-metrics.sh
./scripts/check-canary-metrics.sh backend-green backend-blue http://localhost:9090
```

### Switch Traffic to Green

```bash
# Switch traffic to green slot
chmod +x scripts/switch-traffic.sh
./scripts/switch-traffic.sh green

# Verify active slot
curl http://localhost:8081/active-slot
# Should return: green

# Verify traffic is routed to green
curl http://localhost:8080/health
```

### Rollback to Blue

```bash
# Switch back to blue
./scripts/switch-traffic.sh blue

# Verify rollback
curl http://localhost:8081/active-slot
# Should return: blue
```

---

## CI/CD Pipeline

### GitHub Actions Workflows

#### 1. Canary Deployment (`deploy-canary`)

**Triggers**: Push to `main` or `develop`

**Steps**:

1. Determine inactive slot
2. Deploy to canary slot
3. Wait for health checks
4. Generate test traffic
5. Validate metrics
6. Output canary slot for next job

**Environment**: `canary` (no approval required)

#### 2. Production Promotion (`promote-to-production`)

**Triggers**: After successful canary deployment

**Steps**:

1. **Manual approval required** (production environment)
2. Switch traffic to canary slot
3. Monitor production metrics for 5 minutes
4. Auto-rollback if metrics degrade
5. Mark deployment successful

**Environment**: `production` (requires approval)

#### 3. Rollback (`rollback`)

**Triggers**: Manual workflow dispatch

**Steps**:

1. **Manual approval required**
2. Switch traffic to specified slot
3. Verify rollback successful

**Input**: `rollback_slot` (blue or green)

### Environment Protection Rules

Configure in GitHub Settings → Environments:

**Canary Environment**:

- No required reviewers
- Automatic deployment

**Production Environment**:

- Required reviewers: 1+
- Deployment protection rules
- Restrict to `main` branch

---

## Monitoring with Grafana

### Accessing Grafana

```bash
# Open Grafana
http://localhost:3003

# Login with admin credentials
Username: admin
Password: <GF_SECURITY_ADMIN_PASSWORD>
```

### Recommended Dashboards

#### Blue/Green Comparison Dashboard

Create a dashboard comparing both slots:

**Panels**:

1. **Request Rate by Slot**

   ```promql
   rate(http_requests_total{job=~"backend-blue|backend-green"}[5m])
   ```

2. **Error Rate by Slot**

   ```promql
   rate(http_requests_total{job=~"backend-blue|backend-green",status=~"5.."}[5m])
   / rate(http_requests_total{job=~"backend-blue|backend-green"}[5m])
   * 100
   ```

3. **P95 Latency by Slot**

   ```promql
   histogram_quantile(0.95,
     rate(http_request_duration_seconds_bucket{job=~"backend-blue|backend-green"}[5m])
   )
   ```

4. **Active Slot Indicator**
   ```promql
   up{job=~"backend-blue|backend-green"}
   ```

---

## Troubleshooting

### Canary Deployment Failed

**Symptom**: `deploy-canary` job fails

**Possible Causes**:

1. Canary metrics exceed thresholds
2. Health checks failing
3. Container failed to start

**Debug Steps**:

```bash
# Check canary container logs
docker logs llm-backend-green

# Check health status
docker inspect llm-backend-green | jq '.[0].State.Health'

# Manually check metrics
./scripts/check-canary-metrics.sh backend-green backend-blue http://localhost:9090

# Check Prometheus targets
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets[] | select(.labels.job | contains("backend"))'
```

### Traffic Not Switching

**Symptom**: Active slot doesn't change after running switch script

**Debug Steps**:

```bash
# Check Nginx container
docker logs llm-nginx

# Verify Nginx configuration
docker exec llm-nginx cat /etc/nginx/nginx.conf

# Check which config file is mounted
docker inspect llm-nginx | jq '.[0].Mounts[] | select(.Destination=="/etc/nginx/nginx.conf")'

# Manually reload Nginx
docker exec llm-nginx nginx -s reload
```

### Metrics Not Available

**Symptom**: Prometheus queries return no data

**Debug Steps**:

```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Verify backend is exposing metrics
curl http://localhost:8080/metrics | grep http_requests_total

# Check Prometheus scrape config
docker exec prometheus cat /etc/prometheus/prometheus.yml

# Reload Prometheus config
curl -X POST http://localhost:9090/-/reload
```

### Rollback Needed

**Scenario**: Production deployment has issues

**Immediate Action**:

```bash
# Option 1: Use script locally
./scripts/switch-traffic.sh blue

# Option 2: Trigger GitHub Actions rollback
# Go to Actions → Rollback → Run workflow
# Select slot: blue
```

---

## Best Practices

### 1. Always Test Canary First

- Never skip canary validation
- Generate sufficient traffic for meaningful metrics
- Wait for full metrics collection period

### 2. Monitor After Promotion

- Watch Grafana dashboards during promotion
- Keep previous slot running for quick rollback
- Monitor for at least 5 minutes post-promotion

### 3. Gradual Rollouts

- Use canary for initial validation
- Consider traffic splitting for larger changes
- Monitor business metrics alongside technical metrics

### 4. Maintain Both Slots

- Keep both slots deployable
- Regularly test rollback procedure
- Update both slots with security patches

### 5. Document Deployments

- Tag releases with meaningful versions
- Document what changed in each deployment
- Keep rollback runbook updated

---

## Configuration Files

### Key Files

| File                              | Purpose                             |
| --------------------------------- | ----------------------------------- |
| `docker-compose.blue-green.yml`   | Blue/Green deployment configuration |
| `nginx-blue.conf`                 | Nginx config routing to blue slot   |
| `nginx-green.conf`                | Nginx config routing to green slot  |
| `prometheus-blue-green.yml`       | Prometheus scraping both slots      |
| `scripts/check-canary-metrics.sh` | Canary metrics validation           |
| `scripts/switch-traffic.sh`       | Traffic switching automation        |
| `scripts/get-inactive-slot.sh`    | Determine inactive slot             |
| `.env.blue`                       | Blue slot environment variables     |
| `.env.green`                      | Green slot environment variables    |

---

## Next Steps

### Phase 12: Advanced Progressive Delivery

- Implement traffic splitting (10% canary, 90% production)
- Add automated rollback based on business metrics
- Implement feature flags for gradual rollouts
- Add A/B testing capabilities

### Phase 13: Multi-Region Deployment

- Deploy to multiple regions
- Implement geo-routing
- Add cross-region failover
- Monitor global metrics

---

## Summary

Phase 11 provides:

✅ Zero-downtime deployments via Blue/Green strategy  
✅ Automated canary validation with Prometheus metrics  
✅ Instant rollback capability (<30 seconds)  
✅ Manual approval gates for production promotion  
✅ Comprehensive monitoring and alerting  
✅ Local testing capabilities

Your deployment pipeline is now production-ready with enterprise-grade progressive delivery capabilities.
