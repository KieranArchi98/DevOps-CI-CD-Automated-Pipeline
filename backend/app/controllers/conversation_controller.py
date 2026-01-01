from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..services.conversation_service import ConversationService
from ..schemas.conversation import Conversation, Message
from typing import List


router = APIRouter(prefix="/conversations", tags=["conversations"])


class ConversationCreateRequest(BaseModel):
    user_id: str
    title: str


@router.post("/", response_model=Conversation)
async def create_conversation(data: ConversationCreateRequest):
    return await ConversationService.create_conversation(data.user_id, data.title)


@router.get("/", response_model=List[Conversation])
async def list_conversations(user_id: str):
    return await ConversationService.list_conversations(user_id)


@router.get("/{conversation_id}", response_model=Conversation)
async def get_conversation(conversation_id: str):
    conv = await ConversationService.get_conversation(conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@router.post("/{conversation_id}/messages", response_model=Message)
async def add_message(conversation_id: str, message: Message):
    return await ConversationService.add_message(conversation_id, message)


@router.get("/{conversation_id}/messages", response_model=List[Message])
async def get_messages(conversation_id: str):
    return await ConversationService.get_messages(conversation_id)


@router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: str):
    deleted = await ConversationService.delete_conversation(conversation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"success": True}


class ConversationRenameRequest(BaseModel):
    title: str


@router.patch("/{conversation_id}")
async def rename_conversation(conversation_id: str, data: ConversationRenameRequest):
    renamed = await ConversationService.rename_conversation(conversation_id, data.title)
    if not renamed:
        raise HTTPException(
            status_code=404, detail="Conversation not found or not updated"
        )
    return {"success": True}
