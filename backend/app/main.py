from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from .api.api_router import api_router
from dotenv import load_dotenv
from prometheus_fastapi_instrumentator import Instrumentator
from prometheus_client import Counter, Histogram
import time

load_dotenv()

app = FastAPI()

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
