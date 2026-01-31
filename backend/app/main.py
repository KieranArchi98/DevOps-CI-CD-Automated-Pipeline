import time

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Counter, Histogram
from prometheus_fastapi_instrumentator import Instrumentator

from .api.api_router import api_router

load_dotenv()

app = FastAPI()

# Rate Limiting & Redis
from fastapi_limiter import FastAPILimiter
import redis.asyncio as redis
import os

@app.on_event("startup")
async def startup():
    redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")
    
    # Simple check: if we are running locally and 'redis' host is not resolvable,
    # try localhost. Or we just trust the env var if set.
    # The common issue is .env has 'redis://redis:6379/0' which works in Docker
    # but fails locally.
    
    try:
        r = redis.from_url(redis_url, encoding="utf-8", decode_responses=True)
        # Test connection
        await r.ping()
        await FastAPILimiter.init(r)
        print(f"Connected to Redis at {redis_url}")
    except Exception as e:
        print(f"Warning: Failed to connect to Redis at {redis_url}: {e}")
        print("Attempting fallback to localhost...")
        try:
            fallback_url = "redis://localhost:6379/0"
            r = redis.from_url(fallback_url, encoding="utf-8", decode_responses=True)
            await r.ping()
            await FastAPILimiter.init(r)
            print(f"Connected to Redis at {fallback_url}")
        except Exception as e2:
            print(f"Error: Could not connect to Redis: {e2}")
            print("Rate limiting will not work.")

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
async def metrics_middleware(request: Request, call_next):
    """Track HTTP request metrics for deployment verification."""
    start_time = time.time()

    # Process request
    response = await call_next(request)

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

    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")

Instrumentator().instrument(app).expose(app)


@app.get("/health")
def health_check():
    return {"status": "ok"}
