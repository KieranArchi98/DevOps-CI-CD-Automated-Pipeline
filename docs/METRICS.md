# Metrics API Documentation

## Overview

The Genesis AI Chatbot exposes comprehensive metrics for monitoring via Prometheus and visualization in Grafana. This document describes the available metrics, how to configure Prometheus scraping, and provides example queries and dashboard configurations.

## Available Endpoints

### `/metrics` - Prometheus Metrics Endpoint

The main metrics endpoint that exposes all application and HTTP metrics in Prometheus format.

**URL:** `http://localhost:8000/metrics`

**Format:** Prometheus text-based exposition format

**Authentication:** None (consider adding authentication in production)

### `/api/metrics/summary` - JSON Summary

A JSON endpoint providing a quick overview of metrics status.

**URL:** `http://localhost:8000/api/metrics/summary`

**Format:** JSON

**Example Response:**

```json
{
  "llm": {
    "total_api_calls": "See /metrics for detailed breakdown",
    "total_tokens": "See /metrics for detailed breakdown"
  },
  "messages": {
    "total_messages": "See /metrics for detailed breakdown"
  },
  "conversations": {
    "total_created": "See /metrics for detailed breakdown",
    "active_count": "See /metrics for current gauge value"
  },
  "info": "For detailed metrics, scrape /metrics endpoint with Prometheus"
}
```

### `/api/metrics/health` - Metrics Health Check

Health check endpoint for the metrics system.

**URL:** `http://localhost:8000/api/metrics/health`

**Format:** JSON

## Custom Application Metrics

### LLM Metrics

#### `genesis_ai_llm_api_calls_total`

- **Type:** Counter
- **Labels:** `model`, `status`
- **Description:** Total number of LLM API calls made
- **Example:** `genesis_ai_llm_api_calls_total{model="gpt-3.5-turbo",status="success"} 42`

#### `genesis_ai_llm_tokens_total`

- **Type:** Counter
- **Labels:** `model`, `token_type`
- **Description:** Total number of tokens used in LLM API calls
- **Token Types:** `prompt`, `completion`, `total`
- **Example:** `genesis_ai_llm_tokens_total{model="gpt-3.5-turbo",token_type="total"} 15420`

#### `genesis_ai_llm_token_usage`

- **Type:** Histogram
- **Labels:** `model`, `token_type`
- **Description:** Distribution of token usage per LLM API call
- **Buckets:** 10, 50, 100, 250, 500, 1000, 2500, 5000, 10000

#### `genesis_ai_llm_response_time_seconds`

- **Type:** Histogram
- **Labels:** `model`
- **Description:** LLM API response time in seconds
- **Buckets:** 0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0

### Message Metrics

#### `genesis_ai_messages_total`

- **Type:** Counter
- **Labels:** `role`
- **Description:** Total number of messages created
- **Roles:** `user`, `assistant`
- **Example:** `genesis_ai_messages_total{role="user"} 25`

#### `genesis_ai_message_length_characters`

- **Type:** Histogram
- **Labels:** `role`
- **Description:** Distribution of message lengths in characters
- **Buckets:** 10, 50, 100, 250, 500, 1000, 2500, 5000

### Conversation Metrics

#### `genesis_ai_conversations_total`

- **Type:** Counter
- **Description:** Total number of conversations created
- **Example:** `genesis_ai_conversations_total 10`

#### `genesis_ai_conversations_deleted_total`

- **Type:** Counter
- **Description:** Total number of conversations deleted
- **Example:** `genesis_ai_conversations_deleted_total 2`

#### `genesis_ai_active_conversations`

- **Type:** Gauge
- **Description:** Current number of active conversations
- **Example:** `genesis_ai_active_conversations 8`

#### `genesis_ai_messages_per_conversation`

- **Type:** Histogram
- **Description:** Distribution of messages per conversation
- **Buckets:** 1, 5, 10, 20, 50, 100, 200

### Error Metrics

#### `genesis_ai_errors_total`

- **Type:** Counter
- **Labels:** `error_type`, `service`
- **Description:** Total number of errors by type
- **Example:** `genesis_ai_errors_total{error_type="api_error",service="llm"} 1`

### Application Info

#### `genesis_ai_application_info`

- **Type:** Info
- **Description:** Application information (version, name, default model)

## Standard HTTP Metrics

The `prometheus-fastapi-instrumentator` automatically provides these metrics:

- `http_requests_total` - Total HTTP requests
- `http_request_duration_seconds` - HTTP request latency
- `http_request_size_bytes` - HTTP request size
- `http_response_size_bytes` - HTTP response size
- `http_requests_inprogress` - In-progress HTTP requests

## Prometheus Configuration

### prometheus.yml

Add this scrape configuration to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: "genesis-ai-chatbot"
    scrape_interval: 15s
    static_configs:
      - targets: ["localhost:8000"]
    metrics_path: "/metrics"
```

### Docker Compose Example

```yaml
version: "3.8"

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.path=/prometheus"

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
    depends_on:
      - prometheus

volumes:
  prometheus_data:
  grafana_data:
```

## Example Prometheus Queries

### Token Usage

**Total tokens used:**

```promql
sum(genesis_ai_llm_tokens_total{token_type="total"})
```

**Token usage rate (tokens per minute):**

```promql
rate(genesis_ai_llm_tokens_total{token_type="total"}[5m]) * 60
```

**Average tokens per request:**

```promql
rate(genesis_ai_llm_tokens_total{token_type="total"}[5m]) / rate(genesis_ai_llm_api_calls_total{status="success"}[5m])
```

**95th percentile token usage:**

```promql
histogram_quantile(0.95, rate(genesis_ai_llm_token_usage_bucket{token_type="total"}[5m]))
```

### API Performance

**LLM API success rate:**

```promql
sum(rate(genesis_ai_llm_api_calls_total{status="success"}[5m])) / sum(rate(genesis_ai_llm_api_calls_total[5m])) * 100
```

**Average LLM response time:**

```promql
rate(genesis_ai_llm_response_time_seconds_sum[5m]) / rate(genesis_ai_llm_response_time_seconds_count[5m])
```

**95th percentile LLM response time:**

```promql
histogram_quantile(0.95, rate(genesis_ai_llm_response_time_seconds_bucket[5m]))
```

### Messages and Conversations

**Message creation rate:**

```promql
sum(rate(genesis_ai_messages_total[5m])) by (role)
```

**Active conversations:**

```promql
genesis_ai_active_conversations
```

**Conversation creation rate:**

```promql
rate(genesis_ai_conversations_total[5m])
```

**Average messages per conversation:**

```promql
sum(genesis_ai_messages_total) / sum(genesis_ai_conversations_total)
```

### Error Monitoring

**Error rate:**

```promql
sum(rate(genesis_ai_errors_total[5m])) by (error_type, service)
```

**LLM API error rate:**

```promql
sum(rate(genesis_ai_llm_api_calls_total{status="error"}[5m]))
```

## Grafana Dashboard Configuration

### Sample Dashboard JSON

Create a new dashboard in Grafana and import this configuration:

```json
{
  "dashboard": {
    "title": "Genesis AI Chatbot Metrics",
    "panels": [
      {
        "title": "Total Tokens Used",
        "targets": [
          {
            "expr": "sum(genesis_ai_llm_tokens_total{token_type=\"total\"})"
          }
        ],
        "type": "stat"
      },
      {
        "title": "Token Usage Rate",
        "targets": [
          {
            "expr": "rate(genesis_ai_llm_tokens_total{token_type=\"total\"}[5m]) * 60",
            "legendFormat": "Tokens/min"
          }
        ],
        "type": "graph"
      },
      {
        "title": "LLM Response Time (95th percentile)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(genesis_ai_llm_response_time_seconds_bucket[5m]))"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Active Conversations",
        "targets": [
          {
            "expr": "genesis_ai_active_conversations"
          }
        ],
        "type": "stat"
      },
      {
        "title": "Message Creation Rate",
        "targets": [
          {
            "expr": "sum(rate(genesis_ai_messages_total[5m])) by (role)",
            "legendFormat": "{{role}}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "API Success Rate",
        "targets": [
          {
            "expr": "sum(rate(genesis_ai_llm_api_calls_total{status=\"success\"}[5m])) / sum(rate(genesis_ai_llm_api_calls_total[5m])) * 100"
          }
        ],
        "type": "gauge"
      }
    ]
  }
}
```

### Key Panels to Include

1. **Overview Stats**
   - Total tokens used (all time)
   - Active conversations
   - Total messages
   - API success rate

2. **Performance Graphs**
   - LLM response time (p50, p95, p99)
   - Token usage rate over time
   - Request rate over time

3. **Usage Breakdown**
   - Messages by role (user vs assistant)
   - Token usage by type (prompt vs completion)
   - Conversation activity

4. **Error Monitoring**
   - Error rate over time
   - Errors by type and service
   - Failed API calls

## Alerting Rules

### Example Prometheus Alert Rules

Create an `alerts.yml` file:

```yaml
groups:
  - name: genesis_ai_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: sum(rate(genesis_ai_errors_total[5m])) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors/sec"

      - alert: LLMResponseTimeSlow
        expr: histogram_quantile(0.95, rate(genesis_ai_llm_response_time_seconds_bucket[5m])) > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "LLM response time is slow"
          description: "95th percentile response time is {{ $value }}s"

      - alert: LLMAPIFailures
        expr: sum(rate(genesis_ai_llm_api_calls_total{status="error"}[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "LLM API failures detected"
          description: "LLM API error rate is {{ $value }} errors/sec"

      - alert: HighTokenUsage
        expr: rate(genesis_ai_llm_tokens_total{token_type="total"}[1h]) * 3600 > 100000
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High token usage detected"
          description: "Token usage rate is {{ $value }} tokens/hour"
```

## Security Considerations

### Production Deployment

1. **Authentication:** Add authentication to the `/metrics` endpoint
2. **Network Security:** Restrict access via firewall rules to only Prometheus servers
3. **Separate Port:** Consider exposing metrics on a separate port (e.g., 9090)
4. **HTTPS:** Use HTTPS for metrics endpoints in production

### Example: Adding Authentication

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
import secrets

security = HTTPBasic()

def verify_metrics_auth(credentials: HTTPBasicCredentials = Depends(security)):
    correct_username = secrets.compare_digest(credentials.username, "metrics")
    correct_password = secrets.compare_digest(credentials.password, "secret")
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect credentials",
        )
    return credentials.username
```

## Troubleshooting

### Metrics Not Appearing

1. Check that the server is running: `curl http://localhost:8000/health`
2. Verify metrics endpoint is accessible: `curl http://localhost:8000/metrics`
3. Check Prometheus targets page: `http://localhost:9090/targets`
4. Verify scrape configuration in `prometheus.yml`

### Missing Custom Metrics

1. Ensure the metrics service is initialized (happens automatically on import)
2. Verify that the instrumented code is being executed
3. Check server logs for any errors during metrics tracking

### High Memory Usage

If metrics are consuming too much memory:

1. Reduce histogram bucket counts
2. Limit label cardinality (avoid high-cardinality labels like user IDs)
3. Adjust Prometheus retention settings

## Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [prometheus_client Python Library](https://github.com/prometheus/client_python)
- [FastAPI Prometheus Instrumentator](https://github.com/trallnag/prometheus-fastapi-instrumentator)

docker run -d `  --name prometheus`
-p 9090:9090 `  -v ${PWD}\prometheus.yml:/etc/prometheus/prometheus.yml`
prom/prometheus

http://localhost:9090

docker run -d `  --name grafana`
-p 3003:3000 `
grafana/grafana

http://localhost:9090

1. Start backend (FastAPI)
2. Start Prometheus
3. Start Grafana
4. Open Grafana dashboard
5. Use app → metrics appear
