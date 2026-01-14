#!/bin/bash
set -e

# get-inactive-slot.sh
# Determines which deployment slot is currently inactive
#
# Usage: ./get-inactive-slot.sh
# Returns: "blue" or "green"

PROMETHEUS_URL=${1:-http://localhost:9090}

# Try to determine active slot from nginx
ACTIVE_SLOT=$(curl -s http://localhost:8081/active-slot 2>/dev/null | tr -d '\n' || echo "")

if [ -z "$ACTIVE_SLOT" ]; then
    # Fallback: check which slot has more traffic
    BLUE_TRAFFIC=$(curl -s "${PROMETHEUS_URL}/api/v1/query?query=rate(http_requests_total{job=\"backend-blue\"}[1m])" | jq -r '.data.result[0].value[1] // "0"')
    GREEN_TRAFFIC=$(curl -s "${PROMETHEUS_URL}/api/v1/query?query=rate(http_requests_total{job=\"backend-green\"}[1m])" | jq -r '.data.result[0].value[1] // "0"')
    
    if [ $(echo "$BLUE_TRAFFIC > $GREEN_TRAFFIC" | bc -l) -eq 1 ]; then
        ACTIVE_SLOT="blue"
    else
        ACTIVE_SLOT="green"
    fi
fi

# Return inactive slot
if [ "$ACTIVE_SLOT" == "blue" ]; then
    echo "green"
else
    echo "blue"
fi
