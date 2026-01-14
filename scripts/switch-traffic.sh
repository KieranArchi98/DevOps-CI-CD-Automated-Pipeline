#!/bin/bash
set -e

# switch-traffic.sh
# Switches traffic between blue and green deployment slots
#
# Usage: ./switch-traffic.sh <target_slot>
# Example: ./switch-traffic.sh green

TARGET_SLOT=${1}
COMPOSE_FILE=${2:-docker-compose.blue-green.yml}

if [ -z "$TARGET_SLOT" ]; then
    echo "Usage: $0 <blue|green> [compose-file]"
    echo "Example: $0 green"
    exit 1
fi

if [ "$TARGET_SLOT" != "blue" ] && [ "$TARGET_SLOT" != "green" ]; then
    echo "Error: Target slot must be 'blue' or 'green'"
    exit 1
fi

echo "=========================================="
echo "Traffic Switch"
echo "=========================================="
echo "Target Slot: $TARGET_SLOT"
echo ""

# Check if target slot is healthy
echo "1. Checking target slot health..."

if [ "$TARGET_SLOT" == "blue" ]; then
    BACKEND_CONTAINER="llm-backend-blue"
    FRONTEND_CONTAINER="llm-frontend-blue"
else
    BACKEND_CONTAINER="llm-backend-green"
    FRONTEND_CONTAINER="llm-frontend-green"
fi

# Check if containers are running
if ! docker ps --format '{{.Names}}' | grep -q "^${BACKEND_CONTAINER}$"; then
    echo "❌ ERROR: Backend container $BACKEND_CONTAINER is not running"
    exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -q "^${FRONTEND_CONTAINER}$"; then
    echo "❌ ERROR: Frontend container $FRONTEND_CONTAINER is not running"
    exit 1
fi

# Check health status
BACKEND_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$BACKEND_CONTAINER" 2>/dev/null || echo "unknown")
FRONTEND_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$FRONTEND_CONTAINER" 2>/dev/null || echo "unknown")

echo "  Backend ($BACKEND_CONTAINER): $BACKEND_HEALTH"
echo "  Frontend ($FRONTEND_CONTAINER): $FRONTEND_HEALTH"

if [ "$BACKEND_HEALTH" != "healthy" ]; then
    echo "⚠️  WARNING: Backend is not healthy, but proceeding with switch"
fi

if [ "$FRONTEND_HEALTH" != "healthy" ]; then
    echo "⚠️  WARNING: Frontend is not healthy, but proceeding with switch"
fi

echo "✅ Target slot containers are running"
echo ""

# Switch traffic by updating nginx configuration
echo "2. Switching traffic to $TARGET_SLOT slot..."

# Update the nginx configuration symlink/volume
export ACTIVE_SLOT=$TARGET_SLOT

# Recreate nginx container with new configuration
docker-compose -f "$COMPOSE_FILE" up -d nginx

echo "✅ Nginx restarted with $TARGET_SLOT configuration"
echo ""

# Wait for nginx to be healthy
echo "3. Waiting for Nginx to be healthy..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    NGINX_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' llm-nginx 2>/dev/null || echo "unknown")
    
    if [ "$NGINX_HEALTH" == "healthy" ]; then
        echo "✅ Nginx is healthy"
        break
    fi
    
    echo "  Attempt $((attempt + 1))/$max_attempts - Nginx status: $NGINX_HEALTH"
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ ERROR: Nginx failed to become healthy"
    exit 1
fi
echo ""

# Verify traffic is flowing to the correct slot
echo "4. Verifying traffic routing..."

ACTIVE_SLOT_CHECK=$(curl -s http://localhost:8081/active-slot 2>/dev/null || echo "unknown")

if [ "$ACTIVE_SLOT_CHECK" == "$TARGET_SLOT" ]; then
    echo "✅ Traffic is correctly routed to $TARGET_SLOT slot"
else
    echo "⚠️  WARNING: Active slot check returned: $ACTIVE_SLOT_CHECK (expected: $TARGET_SLOT)"
fi
echo ""

# Test health endpoint through nginx
echo "5. Testing health endpoint through Nginx..."

if curl -sf http://localhost:8080/health > /dev/null; then
    echo "✅ Health endpoint responding correctly"
else
    echo "❌ ERROR: Health endpoint not responding"
    exit 1
fi
echo ""

echo "=========================================="
echo "✅ Traffic switch complete!"
echo "=========================================="
echo "Active Slot: $TARGET_SLOT"
echo "Traffic is now being served by:"
echo "  Backend: $BACKEND_CONTAINER"
echo "  Frontend: $FRONTEND_CONTAINER"
echo ""

exit 0
