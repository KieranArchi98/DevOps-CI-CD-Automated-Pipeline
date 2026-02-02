"""
Graceful shutdown handler for production environments.
Handles SIGTERM and SIGINT signals to allow in-flight requests to complete.
"""
import signal
import sys
import logging
from typing import Callable, Optional
import asyncio

logger = logging.getLogger(__name__)


class GracefulShutdown:
    """Handles graceful shutdown of the application."""
    
    def __init__(self, shutdown_timeout: int = 30):
        """
        Initialize graceful shutdown handler.
        
        Args:
            shutdown_timeout: Maximum seconds to wait for in-flight requests
        """
        self.shutdown_timeout = shutdown_timeout
        self.is_shutting_down = False
        self.shutdown_event = asyncio.Event()
    
    def setup_signal_handlers(self, cleanup_callback: Optional[Callable] = None):
        """
        Setup signal handlers for SIGTERM and SIGINT.
        
        Args:
            cleanup_callback: Optional async function to call during shutdown
        """
        def signal_handler(signum, frame):
            """Handle shutdown signals."""
            sig_name = signal.Signals(signum).name
            logger.info(f"Received {sig_name} signal, initiating graceful shutdown...")
            
            if self.is_shutting_down:
                logger.warning("Shutdown already in progress, ignoring signal")
                return
            
            self.is_shutting_down = True
            
            # Run cleanup in event loop if provided
            if cleanup_callback:
                try:
                    loop = asyncio.get_event_loop()
                    if loop.is_running():
                        loop.create_task(self._shutdown_with_cleanup(cleanup_callback))
                    else:
                        loop.run_until_complete(self._shutdown_with_cleanup(cleanup_callback))
                except Exception as e:
                    logger.error(f"Error during cleanup: {e}", exc_info=True)
            
            # Set shutdown event
            self.shutdown_event.set()
        
        # Register signal handlers
        signal.signal(signal.SIGTERM, signal_handler)
        signal.signal(signal.SIGINT, signal_handler)
        
        logger.info("Graceful shutdown handlers registered for SIGTERM and SIGINT")
    
    async def _shutdown_with_cleanup(self, cleanup_callback: Callable):
        """Execute cleanup callback during shutdown."""
        try:
            logger.info("Running cleanup tasks...")
            await cleanup_callback()
            logger.info("Cleanup completed successfully")
        except Exception as e:
            logger.error(f"Error during cleanup: {e}", exc_info=True)
    
    async def wait_for_shutdown(self):
        """Wait for shutdown signal."""
        await self.shutdown_event.wait()
