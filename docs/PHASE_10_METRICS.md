# Phase 10 — Metrics-Aware Deployment Verification

## Overview

Phase 10 implements automatic deployment verification using Prometheus metrics. Deployments are automatically approved or rejected based on real-time application health metrics including error rates, latency, and availability.

## Metrics Exposed

### HTTP Request Metrics

The backend exposes the following HTTP-level metrics for deployment verification:

#### `http_requests_total`

- **Type**: Counter
- **Description**: Total number of HTTP requests
- **Labels**:
  - `method`: HTTP method (GET, POST, etc.)
  - `endpoint`: Request path
  - `status`: HTTP status code

#### `http_request_duration_seconds`

- **Type**: Histogram
- **Description**: HTTP request latency in seconds
- **Labels**:
  - `method`: HTTP method
  - `endpoint`: Request path
- **Buckets**: [0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0, 10.0]

### Application Metrics

In addition to HTTP metrics, the application exposes custom metrics via `MetricsService`:

- `genesis_ai_llm_api_calls_total` - LLM API call tracking
- `genesis_ai_llm_tokens_total` - Token usage tracking
- `genesis_ai_llm_response_time_seconds` - LLM response latency
- `genesis_ai_messages_total` - Message creation tracking
- `genesis_ai_conversations_total` - Conversation tracking
- `genesis_ai_errors_total` - Error tracking by type and service
- `genesis_ai_active_conversations` - Current active conversations (gauge)

## Prometheus Queries Used in CI/CD

### Error Rate Check

**Query**: `rate(http_requests_total{status=~"5.."}[2m]) / rate(http_requests_total[2m])`

**Purpose**: Calculate the percentage of requests returning 5xx errors over the last 2 minutes

**Threshold**: > 5%

**Action**: Deployment fails if error rate exceeds threshold

### Latency Check

**Query**: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[2m]))`

**Purpose**: Calculate the 95th percentile (P95) request latency over the last 2 minutes

**Threshold**: > 2.0 seconds

**Action**: Deployment fails if P95 latency exceeds threshold

### Availability Check

**Method**: Direct HTTP health check to `/health` endpoint

**Threshold**: Must return 200 OK

**Action**: Deployment fails if health check fails

## Deployment Thresholds

| Metric           | Threshold              | Rationale                                                                                                     |
| ---------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Error Rate**   | > 5%                   | Indicates significant application issues; 5% allows for some transient errors while catching serious problems |
| **P95 Latency**  | > 2.0s                 | Ensures good user experience; 95th percentile means 95% of requests complete faster                           |
| **Availability** | Health check must pass | Basic sanity check that application is running and responding                                                 |

## Adjusting Thresholds

To adjust deployment verification thresholds, edit `.github/workflows/ci-cd.yml`:

### Changing Error Rate Threshold

Find the "Check HTTP error rate" step and modify:

```yaml
# Fail if error rate > 5%
if (( $(echo "$ERROR_PCT > 5.0" | bc -l) )); then
```

Change `5.0` to your desired percentage (e.g., `10.0` for 10%).

### Changing Latency Threshold

Find the "Check HTTP latency" step and modify:

```yaml
# Fail if P95 latency > 2 seconds
if (( $(echo "$LATENCY_RESULT > 2.0" | bc -l) )); then
```

Change `2.0` to your desired latency in seconds (e.g., `5.0` for 5 seconds).

### Changing Percentile

To check P99 instead of P95, modify the query:

```yaml
LATENCY_QUERY='histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[2m]))'
```

Change `0.95` to `0.99` (or `0.50` for median, `0.90` for P90, etc.).

## Troubleshooting Failed Deployments

### Deployment Failed: High Error Rate

**Symptom**: CI/CD logs show "ERROR: Error rate (X%) exceeds threshold (5%)"

**Possible Causes**:

1. Application code introduced a bug causing 5xx errors
2. Database connection issues
3. External API failures (e.g., OpenAI API)
4. Configuration errors in environment variables

**Steps to Debug**:

1. Check GitHub Actions logs for the exact error percentage
2. Access Prometheus at `http://localhost:9090` and run:
   ```
   rate(http_requests_total{status=~"5.."}[5m])
   ```
3. Check application logs:
   ```bash
   docker logs llm-backend
   ```
4. Review recent code changes that might have introduced errors
5. Verify all environment variables are set correctly in `.env.prod`

### Deployment Failed: High Latency

**Symptom**: CI/CD logs show "ERROR: P95 latency (X s) exceeds threshold (2.0 s)"

**Possible Causes**:

1. Database query performance degradation
2. External API slowness (e.g., OpenAI API)
3. Insufficient resources (CPU/memory)
4. Network issues

**Steps to Debug**:

1. Check Prometheus for latency breakdown by endpoint:
   ```
   histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) by (endpoint)
   ```
2. Identify which endpoints are slow
3. Check resource usage:
   ```bash
   docker stats
   ```
4. Review database query performance
5. Check external API response times

### Deployment Failed: Health Check

**Symptom**: CI/CD logs show "ERROR: Backend health check failed"

**Possible Causes**:

1. Application failed to start
2. Port binding issues
3. Dependency failures (MongoDB, Redis)
4. Configuration errors

**Steps to Debug**:

1. Check if backend container is running:
   ```bash
   docker ps -a
   ```
2. Check backend logs:
   ```bash
   docker logs llm-backend
   ```
3. Verify dependencies are running:
   ```bash
   docker ps | grep -E "redis|mongo"
   ```
4. Try accessing health endpoint manually:
   ```bash
   curl http://localhost:8080/health
   ```

### Prometheus Not Scraping Metrics

**Symptom**: CI/CD logs show "WARNING: Prometheus is not successfully scraping backend"

**Note**: This is a warning, not a failure. Deployment continues but metrics checks are skipped.

**Steps to Fix**:

1. Check Prometheus targets at `http://localhost:9090/targets`
2. Verify backend is exposing metrics:
   ```bash
   curl http://localhost:8080/metrics
   ```
3. Check Prometheus configuration in `prometheus.yml`
4. Verify Docker networking allows Prometheus to reach backend
5. Check Prometheus logs:
   ```bash
   docker logs prometheus
   ```

## Viewing Metrics Locally

### Access Prometheus UI

1. Start services:

   ```bash
   docker-compose --env-file .env.dev up -d
   ```

2. Open browser to `http://localhost:9090`

3. Try these queries:
   - Total requests: `rate(http_requests_total[5m])`
   - Error rate: `rate(http_requests_total{status=~"5.."}[5m])`
   - P95 latency: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))`
   - Active conversations: `genesis_ai_active_conversations`

### Access Grafana Dashboards

1. Open browser to `http://localhost:3003`
2. Login with admin credentials (from `GF_SECURITY_ADMIN_PASSWORD`)
3. Create dashboards using the metrics above

### Test Metrics Endpoint

```bash
# View raw Prometheus metrics
curl http://localhost:8080/metrics

# View metrics summary (JSON)
curl http://localhost:8080/api/metrics/summary

# Check metrics health
curl http://localhost:8080/api/metrics/health
```

## CI/CD Workflow

The deployment verification workflow:

1. **Deploy Services** - Pull and start containers
2. **Wait for Health** - Poll `/health` endpoint (max 2.5 minutes)
3. **Wait for Metrics** - Sleep 30s for Prometheus to scrape
4. **Generate Traffic** - Make 20 test requests
5. **Verify Scraping** - Check Prometheus is collecting metrics
6. **Check Error Rate** - Query and validate error percentage
7. **Check Latency** - Query and validate P95 latency
8. **Final Health Check** - Confirm availability
9. **Success** - Deployment approved

If any step fails, the deployment is rolled back automatically by GitHub Actions.

## Best Practices

1. **Monitor Trends**: Use Grafana to track metrics over time, not just at deployment
2. **Set Alerts**: Configure Prometheus alerts for sustained threshold violations
3. **Gradual Rollouts**: Consider canary deployments for high-risk changes
4. **Adjust Thresholds**: Review and adjust thresholds based on actual application behavior
5. **Test Locally**: Always test metrics collection locally before pushing to CI/CD

## Next Steps

- **Phase 11**: Implement alerting rules in Prometheus
- **Phase 12**: Set up Grafana dashboards for visualization
- **Phase 13**: Add canary deployment strategy
- **Phase 14**: Implement automatic rollback on sustained metric violations
