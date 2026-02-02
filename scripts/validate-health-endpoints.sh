#!/bin/bash
#
# Health Endpoint Validation Script
# Validates that health and readiness endpoints exist and return expected responses
#

set -e

echo "=== Health Endpoint Validation ==="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FAILED=0

# Function to check endpoint
check_endpoint() {
    local service=$1
    local url=$2
    local expected_status=$3
    local endpoint_type=$4
    
    echo -e "\n${YELLOW}Checking ${service} ${endpoint_type} endpoint: ${url}${NC}"
    
    # Make request and capture response
    response=$(curl -s -w "\n%{http_code}" "${url}" || echo "000")
    
    # Extract status code (last line)
    status_code=$(echo "$response" | tail -n1)
    
    # Extract body (all but last line)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ Status code: ${status_code}${NC}"
        echo "Response: ${body}"
        
        # Validate JSON response contains expected fields
        if echo "$body" | jq -e '.status' > /dev/null 2>&1; then
            status_value=$(echo "$body" | jq -r '.status')
            echo -e "${GREEN}✓ Status field present: ${status_value}${NC}"
        else
            echo -e "${RED}✗ Missing 'status' field in response${NC}"
            FAILED=1
        fi
    else
        echo -e "${RED}✗ Expected status ${expected_status}, got ${status_code}${NC}"
        echo "Response: ${body}"
        FAILED=1
    fi
}

# Check if services are running
echo "Waiting for services to be ready..."
sleep 5

# Backend health checks
echo -e "\n${YELLOW}=== Backend Health Checks ===${NC}"
check_endpoint "Backend" "http://localhost:8000/health" "200" "health"
check_endpoint "Backend" "http://localhost:8000/ready" "200" "readiness"

# Frontend health checks
echo -e "\n${YELLOW}=== Frontend Health Checks ===${NC}"
check_endpoint "Frontend" "http://localhost:3000/api/health" "200" "health"

# Summary
echo -e "\n${YELLOW}=== Validation Summary ===${NC}"
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All health endpoint checks passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some health endpoint checks failed!${NC}"
    exit 1
fi
