from fastapi import APIRouter
from ..controllers import conversation_controller, chat_controller

api_router = APIRouter()

api_router.include_router(conversation_controller.router)
api_router.include_router(chat_controller.router)