"""
Metrics Service for Prometheus/Grafana Integration

This service provides centralized metrics tracking for the Genesis AI Chatbot.
All metrics are exposed in Prometheus format via the /metrics endpoint.
"""

from prometheus_client import Counter, Histogram, Gauge, Info
from typing import Dict, Any
import time


class MetricsService:
    """Centralized service for application metrics tracking."""

    # ============================================================================
    # LLM Metrics
    # ============================================================================

    llm_api_calls_total = Counter(
        "genesis_ai_llm_api_calls_total",
        "Total number of LLM API calls made",
        ["model", "status"],
    )

    llm_tokens_total = Counter(
        "genesis_ai_llm_tokens_total",
        "Total number of tokens used in LLM API calls",
        ["model", "token_type"],
    )

    llm_token_usage_histogram = Histogram(
        "genesis_ai_llm_token_usage",
        "Distribution of token usage per LLM API call",
        ["model", "token_type"],
        buckets=[10, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
    )

    llm_response_time = Histogram(
        "genesis_ai_llm_response_time_seconds",
        "LLM API response time in seconds",
        ["model"],
        buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0],
    )

    # ============================================================================
    # Message Metrics
    # ============================================================================

    messages_total = Counter(
        "genesis_ai_messages_total",
        "Total number of messages created",
        ["role"],
    )

    message_length_histogram = Histogram(
        "genesis_ai_message_length_characters",
        "Distribution of message lengths in characters",
        ["role"],
        buckets=[10, 50, 100, 250, 500, 1000, 2500, 5000],
    )

    # ============================================================================
    # Conversation Metrics
    # ============================================================================

    conversations_total = Counter(
        "genesis_ai_conversations_total",
        "Total number of conversations created",
    )

    conversations_deleted_total = Counter(
        "genesis_ai_conversations_deleted_total",
        "Total number of conversations deleted",
    )

    active_conversations = Gauge(
        "genesis_ai_active_conversations",
        "Current number of active conversations",
    )

    messages_per_conversation = Histogram(
        "genesis_ai_messages_per_conversation",
        "Distribution of messages per conversation",
        buckets=[1, 5, 10, 20, 50, 100, 200],
    )

    # ============================================================================
    # Error Metrics
    # ============================================================================

    errors_total = Counter(
        "genesis_ai_errors_total",
        "Total number of errors by type",
        ["error_type", "service"],
    )

    # ============================================================================
    # Application Info
    # ============================================================================

    app_info = Info(
        "genesis_ai_application",
        "Application information",
    )

    @classmethod
    def initialize(cls):
        """Initialize application info metrics."""
        cls.app_info.info(
            {
                "version": "1.0.0",
                "name": "Genesis AI Chatbot",
                "default_model": "gpt-3.5-turbo",
            }
        )

    # ============================================================================
    # LLM Tracking Methods
    # ============================================================================

    @classmethod
    def track_llm_call(
        cls,
        model: str,
        status: str,
        prompt_tokens: int = 0,
        completion_tokens: int = 0,
        total_tokens: int = 0,
        response_time: float = 0.0,
    ):
        """
        Track an LLM API call with token usage and response time.

        Args:
            model: The model used (e.g., "gpt-3.5-turbo")
            status: Status of the call ("success" or "error")
            prompt_tokens: Number of tokens in the prompt
            completion_tokens: Number of tokens in the completion
            total_tokens: Total tokens used
            response_time: Response time in seconds
        """
        cls.llm_api_calls_total.labels(model=model, status=status).inc()

        if status == "success" and total_tokens > 0:
            # Track token counts
            cls.llm_tokens_total.labels(
                model=model, token_type="prompt"
            ).inc(prompt_tokens)
            cls.llm_tokens_total.labels(
                model=model, token_type="completion"
            ).inc(completion_tokens)
            cls.llm_tokens_total.labels(
                model=model, token_type="total"
            ).inc(total_tokens)

            # Track token usage distribution
            cls.llm_token_usage_histogram.labels(
                model=model, token_type="prompt"
            ).observe(prompt_tokens)
            cls.llm_token_usage_histogram.labels(
                model=model, token_type="completion"
            ).observe(completion_tokens)
            cls.llm_token_usage_histogram.labels(
                model=model, token_type="total"
            ).observe(total_tokens)

        if response_time > 0:
            cls.llm_response_time.labels(model=model).observe(response_time)

    # ============================================================================
    # Message Tracking Methods
    # ============================================================================

    @classmethod
    def track_message(cls, role: str, content_length: int):
        """
        Track a message creation.

        Args:
            role: Message role ("user" or "assistant")
            content_length: Length of message content in characters
        """
        cls.messages_total.labels(role=role).inc()
        cls.message_length_histogram.labels(role=role).observe(content_length)

    # ============================================================================
    # Conversation Tracking Methods
    # ============================================================================

    @classmethod
    def track_conversation_created(cls):
        """Track a new conversation creation."""
        cls.conversations_total.inc()
        cls.active_conversations.inc()

    @classmethod
    def track_conversation_deleted(cls):
        """Track a conversation deletion."""
        cls.conversations_deleted_total.inc()
        cls.active_conversations.dec()

    @classmethod
    def set_active_conversations(cls, count: int):
        """
        Set the current number of active conversations.

        Args:
            count: Number of active conversations
        """
        cls.active_conversations.set(count)

    @classmethod
    def track_conversation_message_count(cls, message_count: int):
        """
        Track the number of messages in a conversation.

        Args:
            message_count: Number of messages in the conversation
        """
        cls.messages_per_conversation.observe(message_count)

    # ============================================================================
    # Error Tracking Methods
    # ============================================================================

    @classmethod
    def track_error(cls, error_type: str, service: str):
        """
        Track an error occurrence.

        Args:
            error_type: Type of error (e.g., "api_error", "database_error")
            service: Service where error occurred (e.g., "llm", "conversation")
        """
        cls.errors_total.labels(error_type=error_type, service=service).inc()

    # ============================================================================
    # Utility Methods
    # ============================================================================

    @classmethod
    def get_metrics_summary(cls) -> Dict[str, Any]:
        """
        Get a summary of current metrics in JSON format.

        Returns:
            Dictionary containing current metric values
        """
        # Note: This is a simplified summary. For production, you might want
        # to use prometheus_client's generate_latest() and parse it.
        return {
            "llm": {
                "total_api_calls": "See /metrics for detailed breakdown",
                "total_tokens": "See /metrics for detailed breakdown",
            },
            "messages": {
                "total_messages": "See /metrics for detailed breakdown",
            },
            "conversations": {
                "total_created": "See /metrics for detailed breakdown",
                "active_count": "See /metrics for current gauge value",
            },
            "info": "For detailed metrics, scrape /metrics endpoint with Prometheus",
        }


# Initialize metrics on module load
MetricsService.initialize()
