from fastapi import Depends
from fastapi_limiter.depends import RateLimiter
from fastapi_limiter import FastAPILimiter

class SafeRateLimiter:
    """
    A wrapper around RateLimiter that doesn't crash if Redis is unavailable.
    """
    def __init__(self, times: int = 1, seconds: int = 0, minutes: int = 0, hours: int = 0):
        self.limiter = RateLimiter(times=times, seconds=seconds, minutes=minutes, hours=hours)

    async def __call__(self, *args, **kwargs):
        # Check if FastAPILimiter is initialized (has redis connection)
        if getattr(FastAPILimiter, "redis", None) is None:
            # Redis is not available, skip rate limiting
            return True
        
        # Proceed with actual rate limiting
        return await self.limiter(*args, **kwargs)
