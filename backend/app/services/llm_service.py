import asyncio
import os
import time

import openai
from dotenv import load_dotenv

from .metrics_service import MetricsService

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")


class LLMService:
    @staticmethod
    async def chat(messages):
        model = "gpt-3.5-turbo"
        start_time = time.time()

        try:
            loop = asyncio.get_event_loop()
            # For openai>=1.0.0, use openai.chat.completions.create
            response = await loop.run_in_executor(
                None,
                lambda: openai.chat.completions.create(
                    model=model,
                    messages=messages,
                ),
            )

            # Calculate response time
            response_time = time.time() - start_time

            # Extract token usage from response
            usage = response.usage
            prompt_tokens = usage.prompt_tokens if usage else 0
            completion_tokens = usage.completion_tokens if usage else 0
            total_tokens = usage.total_tokens if usage else 0

            # Track metrics
            MetricsService.track_llm_call(
                model=model,
                status="success",
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=total_tokens,
                response_time=response_time,
            )

            return response.choices[0].message.content
        except Exception as e:
            # Calculate response time even for errors
            response_time = time.time() - start_time

            # Track error metrics
            MetricsService.track_llm_call(
                model=model,
                status="error",
                response_time=response_time,
            )
            MetricsService.track_error(
                error_type="api_error",
                service="llm",
            )

            print(f"[LLMService] OpenAI API error: {e}")
            return "[Error: LLM service unavailable]"
