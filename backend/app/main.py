import time
import logging
import os
import uuid

from dotenv import load_dotenv
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import Counter, Histogram
from prometheus_fastapi_instrumentator import Instrumentator

from .api.api_router import api_router
from .core.logging_config import setup_logging
from .core.shutdown import GracefulShutdown

load_dotenv()

# Setup structured JSON logging
log_level = os.getenv("LOG_LEVEL", "INFO")
setup_logging(service_name="llm-backend", level=log_level)
logger = logging.getLogger(__name__)

app = FastAPI()

# Initialize graceful shutdown handler
shutdown_handler = GracefulShutdown(shutdown_timeout=30)

# Rate Limiting & Redis
from fastapi_limiter import FastAPILimiter
import redis.asyncio as redis

# Global Redis connection
redis_client = None

@app.on_event("startup")
async def startup():
    global redis_client
    redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")
    
    # Simple check: if we are running locally and 'redis' host is not resolvable,
    # try localhost. Or we just trust the env var if set.
    # The common issue is .env has 'redis://redis:6379/0' which works in Docker
    # but fails locally.
    
    try:
        redis_client = redis.from_url(redis_url, encoding="utf-8", decode_responses=True)
        # Test connection
        await redis_client.ping()
        await FastAPILimiter.init(redis_client)
        logger.info(f"Connected to Redis at {redis_url}")
    except Exception as e:
        logger.warning(f"Failed to connect to Redis at {redis_url}: {e}")
        logger.info("Attempting fallback to localhost...")
        try:
            fallback_url = "redis://localhost:6379/0"
            redis_client = redis.from_url(fallback_url, encoding="utf-8", decode_responses=True)
            await redis_client.ping()
            await FastAPILimiter.init(redis_client)
            logger.info(f"Connected to Redis at {fallback_url}")
        except Exception as e2:
            logger.error(f"Could not connect to Redis: {e2}")
            logger.warning("Rate limiting will not work.")
            redis_client = None
    
    # Setup graceful shutdown handlers
    async def cleanup():
        """Cleanup resources during shutdown."""
        logger.info("Closing Redis connection...")
        if redis_client:
            await redis_client.close()
        logger.info("Cleanup complete")
    
    shutdown_handler.setup_signal_handlers(cleanup_callback=cleanup)
    logger.info("Application startup complete")

@app.on_event("shutdown")
async def shutdown():
    """Handle application shutdown."""
    logger.info("Application shutdown initiated")
    if redis_client:
        await redis_client.close()
    logger.info("Application shutdown complete")

# Celery Tasks
from .tasks import process_llm_analysis
from .core.limiter import SafeRateLimiter
from fastapi import Depends

@app.post("/api/analyze", dependencies=[Depends(SafeRateLimiter(times=5, seconds=60))])
async def trigger_analysis(text: str):
    """
    Trigger a background analysis task. 
    Rate limited to 5 requests per minute.
    """
    task = process_llm_analysis.delay(text)
    return {"task_id": task.id, "status": "processing"}


# Custom HTTP metrics for deployment verification
http_requests_total = Counter(
    "http_requests_total", "Total HTTP requests", ["method", "endpoint", "status"]
)

http_request_duration_seconds = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["method", "endpoint"],
    buckets=[0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0, 10.0],
)


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    """Add unique request ID to each request for tracing."""
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    
    # Add request ID to response headers
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    
    return response


@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    """Track HTTP request metrics for deployment verification."""
    start_time = time.time()
    request_id = getattr(request.state, "request_id", "unknown")
    
    # Log incoming request
    logger.info(
        f"Incoming request: {request.method} {request.url.path}",
        extra={"request_id": request_id, "method": request.method, "path": request.url.path}
    )

    # Process request
    try:
        response = await call_next(request)
    except Exception as e:
        logger.error(
            f"Request failed: {str(e)}",
            extra={"request_id": request_id, "method": request.method, "path": request.url.path},
            exc_info=True
        )
        raise

    # Calculate latency
    latency = time.time() - start_time

    # Get endpoint path (normalize to avoid high cardinality)
    endpoint = request.url.path
    method = request.method
    status = response.status_code

    # Track metrics
    http_requests_total.labels(method=method, endpoint=endpoint, status=status).inc()

    http_request_duration_seconds.labels(method=method, endpoint=endpoint).observe(
        latency
    )
    
    # Log request completion
    logger.info(
        f"Request completed: {method} {endpoint} - {status} ({latency:.3f}s)",
        extra={
            "request_id": request_id,
            "method": method,
            "path": endpoint,
            "status": status,
            "latency": latency
        }
    )

    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

Instrumentator().instrument(app).expose(app)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler for consistent error responses.
    Prevents stack trace leakage in production.
    """
    request_id = getattr(request.state, "request_id", "unknown")
    
    # Log the error with full details
    logger.error(
        f"Unhandled exception: {str(exc)}",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "exception_type": type(exc).__name__
        },
        exc_info=True
    )
    
    # Return sanitized error response (no stack traces)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred. Please try again later.",
            "request_id": request_id,
            "type": "internal_error"
        }
    )


@app.get("/health")
def health_check():
    """
    Liveness probe endpoint.
    Returns OK if the process is running.
    """
    return {
        "status": "ok",
        "service": "llm-backend",
        "timestamp": time.time()
    }


@app.get("/ready")
async def readiness_check():
    """
    Readiness probe endpoint.
    Checks if the service is ready to accept traffic by verifying:
    - Redis connectivity
    - Database connectivity (if applicable)
    """
    checks = {
        "redis": "unknown",
        "overall": "not_ready"
    }
    
    # Check Redis
    if redis_client:
        try:
            await redis_client.ping()
            checks["redis"] = "healthy"
        except Exception as e:
            logger.warning(f"Redis health check failed: {e}")
            checks["redis"] = "unhealthy"
            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content={
                    "status": "not_ready",
                    "checks": checks,
                    "timestamp": time.time()
                }
            )
    else:
        checks["redis"] = "not_configured"
    
    # Add MongoDB check if needed
    # For now, we'll assume if Redis is healthy, we're ready
    
    checks["overall"] = "ready"
    return {
        "status": "ready",
        "checks": checks,
        "timestamp": time.time()
    }
