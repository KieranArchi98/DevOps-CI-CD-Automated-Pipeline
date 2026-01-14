#!/bin/bash
set -e

# check-canary-metrics.sh
# Validates canary deployment metrics against thresholds and production baseline
#
# Usage: ./check-canary-metrics.sh <canary_slot> <production_slot> <prometheus_url>
# Example: ./check-canary-metrics.sh backend-green backend-blue http://localhost:9090

CANARY_SLOT=${1:-backend-green}
PRODUCTION_SLOT=${2:-backend-blue}
PROMETHEUS_URL=${3:-http://localhost:9090}

# Thresholds
ERROR_RATE_THRESHOLD=5.0          # Max 5% error rate
LATENCY_THRESHOLD=2.0             # Max 2 seconds P95 latency
ERROR_RATE_MULTIPLIER=2.0         # Canary error rate must not exceed 2x production
LATENCY_MULTIPLIER=1.5            # Canary latency must not exceed 1.5x production

echo "=========================================="
echo "Canary Metrics Validation"
echo "=========================================="
echo "Canary Slot: $CANARY_SLOT"
echo "Production Slot: $PRODUCTION_SLOT"
echo "Prometheus URL: $PROMETHEUS_URL"
echo ""

# Function to query Prometheus
query_prometheus() {
    local query=$1
    local result=$(curl -s "${PROMETHEUS_URL}/api/v1/query?query=${query}" | jq -r '.data.result[0].value[1] // "0"')
    echo "$result"
}

# Function to compare floats
compare_float() {
    awk -v n1="$1" -v op="$2" -v n2="$3" 'BEGIN {print (n1 op n2) ? "1" : "0"}'
}

# ============================================================================
# 1. Check Canary Availability
# ============================================================================

echo "1. Checking canary availability..."
CANARY_UP=$(query_prometheus "up{job=\"${CANARY_SLOT}\"}")

if [ "$CANARY_UP" != "1" ]; then
    echo "❌ FAIL: Canary slot is not up (value: $CANARY_UP)"
    exit 1
fi
echo "✅ PASS: Canary is up and running"
echo ""

# ============================================================================
# 2. Check Canary Error Rate
# ============================================================================

echo "2. Checking canary error rate..."

# Query error rate for canary
ERROR_QUERY="rate(http_requests_total{job=\"${CANARY_SLOT}\",status=~\"5..\"}[2m])"
TOTAL_QUERY="rate(http_requests_total{job=\"${CANARY_SLOT}\"}[2m])"

CANARY_ERRORS=$(query_prometheus "$ERROR_QUERY")
CANARY_TOTAL=$(query_prometheus "$TOTAL_QUERY")

echo "  Canary error rate: $CANARY_ERRORS req/s"
echo "  Canary total rate: $CANARY_TOTAL req/s"

# Calculate error percentage if we have traffic
if [ "$CANARY_TOTAL" != "0" ] && [ "$CANARY_TOTAL" != "0.0" ]; then
    CANARY_ERROR_PCT=$(echo "scale=4; ($CANARY_ERRORS / $CANARY_TOTAL) * 100" | bc -l)
    echo "  Canary error percentage: $CANARY_ERROR_PCT%"
    
    # Check absolute threshold
    if [ $(compare_float "$CANARY_ERROR_PCT" ">" "$ERROR_RATE_THRESHOLD") -eq 1 ]; then
        echo "❌ FAIL: Canary error rate ($CANARY_ERROR_PCT%) exceeds threshold ($ERROR_RATE_THRESHOLD%)"
        exit 1
    fi
    
    # Compare with production
    PROD_ERRORS=$(query_prometheus "rate(http_requests_total{job=\"${PRODUCTION_SLOT}\",status=~\"5..\"}[2m])")
    PROD_TOTAL=$(query_prometheus "rate(http_requests_total{job=\"${PRODUCTION_SLOT}\"}[2m])")
    
    if [ "$PROD_TOTAL" != "0" ] && [ "$PROD_TOTAL" != "0.0" ]; then
        PROD_ERROR_PCT=$(echo "scale=4; ($PROD_ERRORS / $PROD_TOTAL) * 100" | bc -l)
        ALLOWED_ERROR_PCT=$(echo "scale=4; $PROD_ERROR_PCT * $ERROR_RATE_MULTIPLIER" | bc -l)
        
        echo "  Production error percentage: $PROD_ERROR_PCT%"
        echo "  Allowed canary error (${ERROR_RATE_MULTIPLIER}x prod): $ALLOWED_ERROR_PCT%"
        
        if [ $(compare_float "$CANARY_ERROR_PCT" ">" "$ALLOWED_ERROR_PCT") -eq 1 ]; then
            echo "❌ FAIL: Canary error rate exceeds ${ERROR_RATE_MULTIPLIER}x production rate"
            exit 1
        fi
    fi
    
    echo "✅ PASS: Canary error rate is acceptable"
else
    echo "⚠️  WARNING: No traffic detected on canary, skipping error rate check"
fi
echo ""

# ============================================================================
# 3. Check Canary Latency
# ============================================================================

echo "3. Checking canary latency..."

# Query P95 latency for canary
LATENCY_QUERY="histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job=\"${CANARY_SLOT}\"}[2m]))"
CANARY_LATENCY=$(query_prometheus "$LATENCY_QUERY")

echo "  Canary P95 latency: $CANARY_LATENCY seconds"

if [ "$CANARY_LATENCY" != "0" ] && [ "$CANARY_LATENCY" != "0.0" ]; then
    # Check absolute threshold
    if [ $(compare_float "$CANARY_LATENCY" ">" "$LATENCY_THRESHOLD") -eq 1 ]; then
        echo "❌ FAIL: Canary P95 latency ($CANARY_LATENCY s) exceeds threshold ($LATENCY_THRESHOLD s)"
        exit 1
    fi
    
    # Compare with production
    PROD_LATENCY=$(query_prometheus "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job=\"${PRODUCTION_SLOT}\"}[2m]))")
    
    if [ "$PROD_LATENCY" != "0" ] && [ "$PROD_LATENCY" != "0.0" ]; then
        ALLOWED_LATENCY=$(echo "scale=4; $PROD_LATENCY * $LATENCY_MULTIPLIER" | bc -l)
        
        echo "  Production P95 latency: $PROD_LATENCY seconds"
        echo "  Allowed canary latency (${LATENCY_MULTIPLIER}x prod): $ALLOWED_LATENCY seconds"
        
        if [ $(compare_float "$CANARY_LATENCY" ">" "$ALLOWED_LATENCY") -eq 1 ]; then
            echo "❌ FAIL: Canary latency exceeds ${LATENCY_MULTIPLIER}x production latency"
            exit 1
        fi
    fi
    
    echo "✅ PASS: Canary latency is acceptable"
else
    echo "⚠️  WARNING: No latency data available for canary"
fi
echo ""

# ============================================================================
# 4. Summary
# ============================================================================

echo "=========================================="
echo "✅ All canary metrics validation passed!"
echo "=========================================="
echo "Canary deployment is healthy and ready for promotion"
echo ""

exit 0
