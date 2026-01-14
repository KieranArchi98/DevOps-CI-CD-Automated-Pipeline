"""
Metrics Controller for Prometheus/Grafana Integration

Provides endpoints for metrics exposure and summary information.
"""

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from ..services.metrics_service import MetricsService

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("/summary", response_class=JSONResponse)
async def get_metrics_summary():
    """
    Get a JSON summary of current metrics.

    This endpoint provides a quick overview of application metrics
    in JSON format for custom dashboards or health checks.

    For detailed metrics, use the /metrics endpoint for Prometheus scraping.
    """
    summary = MetricsService.get_metrics_summary()
    return summary


@router.get("/health", response_class=JSONResponse)
async def metrics_health():
    """
    Health check endpoint for the metrics system.

    Returns basic status information about the metrics collection.
    """
    return {
        "status": "healthy",
        "metrics_enabled": True,
        "prometheus_endpoint": "/metrics",
        "summary_endpoint": "/api/metrics/summary",
    }
