from fastapi import APIRouter

from ..controllers import (chat_controller, conversation_controller,
                           metrics_controller)

api_router = APIRouter()

api_router.include_router(conversation_controller.router)
api_router.include_router(chat_controller.router)
api_router.include_router(metrics_controller.router)
