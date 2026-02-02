#!/bin/bash
#
# Local Testing Script for Phase 13 Production Hardening
# Tests health endpoints, structured logging, and graceful shutdown
#

set -e

echo "=== Phase 13 Production Hardening - Local Testing ==="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

BACKEND_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:3000"

echo -e "\n${YELLOW}1. Testing Backend Health Endpoint${NC}"
echo "Testing: GET ${BACKEND_URL}/health"

response=$(curl -s "${BACKEND_URL}/health")
echo "Response: ${response}"

if echo "$response" | jq -e '.status == "ok"' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend health endpoint working${NC}"
else
    echo -e "${RED}✗ Backend health endpoint failed${NC}"
    exit 1
fi

echo -e "\n${YELLOW}2. Testing Backend Readiness Endpoint${NC}"
echo "Testing: GET ${BACKEND_URL}/ready"

response=$(curl -s -w "\n%{http_code}" "${BACKEND_URL}/ready")
status_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

echo "Status Code: ${status_code}"
echo "Response: ${body}"

if [ "$status_code" = "200" ] || [ "$status_code" = "503" ]; then
    echo -e "${GREEN}✓ Backend readiness endpoint working${NC}"
    
    if echo "$body" | jq -e '.checks' > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Readiness checks present in response${NC}"
    fi
else
    echo -e "${RED}✗ Backend readiness endpoint failed${NC}"
    exit 1
fi

echo -e "\n${YELLOW}3. Testing Request ID Tracking${NC}"
echo "Testing: GET ${BACKEND_URL}/health with request ID"

response=$(curl -s -i "${BACKEND_URL}/health" | grep -i "x-request-id")
if [ -n "$response" ]; then
    echo -e "${GREEN}✓ Request ID header present: ${response}${NC}"
else
    echo -e "${YELLOW}⚠ Request ID header not found (may be expected in some configurations)${NC}"
fi

echo -e "\n${YELLOW}4. Testing Prometheus Metrics${NC}"
echo "Testing: GET ${BACKEND_URL}/metrics"

response=$(curl -s "${BACKEND_URL}/metrics")
if echo "$response" | grep -q "http_requests_total"; then
    echo -e "${GREEN}✓ Prometheus metrics exposed${NC}"
    echo "Sample metrics:"
    echo "$response" | grep "http_requests_total" | head -n 3
else
    echo -e "${RED}✗ Prometheus metrics not found${NC}"
    exit 1
fi

echo -e "\n${YELLOW}5. Testing Frontend Health Endpoint${NC}"
echo "Testing: GET ${FRONTEND_URL}/api/health"

response=$(curl -s "${FRONTEND_URL}/api/health" 2>/dev/null || echo '{"error": "Frontend not running"}')
echo "Response: ${response}"

if echo "$response" | jq -e '.status == "ok"' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend health endpoint working${NC}"
else
    echo -e "${YELLOW}⚠ Frontend health endpoint not accessible (may not be running)${NC}"
fi

echo -e "\n${YELLOW}6. Testing Error Handling${NC}"
echo "Testing: GET ${BACKEND_URL}/api/nonexistent (should return structured error)"

response=$(curl -s "${BACKEND_URL}/api/nonexistent")
echo "Response: ${response}"

if echo "$response" | jq -e '.request_id' > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Structured error response with request_id${NC}"
else
    echo -e "${YELLOW}⚠ Error response format may vary${NC}"
fi

echo -e "\n${GREEN}=== Testing Complete ===${NC}"
echo ""
echo "Manual Tests:"
echo "1. Check structured logging:"
echo "   - Start backend and observe JSON-formatted logs"
echo "   - Each log should include timestamp, level, service, message"
echo ""
echo "2. Test graceful shutdown:"
echo "   - Start backend: uvicorn app.main:app"
echo "   - Press Ctrl+C"
echo "   - Observe 'Graceful shutdown' messages in logs"
echo ""
echo "3. Test Kubernetes probes:"
echo "   - Deploy to K8s: kubectl apply -f k8s/"
echo "   - Check pod status: kubectl get pods"
echo "   - Describe pod: kubectl describe pod <pod-name>"
echo ""
