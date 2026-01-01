import os
import asyncio
import openai
from dotenv import load_dotenv

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")


class LLMService:
    @staticmethod
    async def chat(messages):
        try:
            loop = asyncio.get_event_loop()
            # For openai>=1.0.0, use openai.chat.completions.create
            response = await loop.run_in_executor(
                None,
                lambda: openai.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=messages,
                ),
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"[LLMService] OpenAI API error: {e}")
            return "[Error: LLM service unavailable]"
