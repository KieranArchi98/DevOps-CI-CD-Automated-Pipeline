from fastapi import APIRouter
from pydantic import BaseModel
from ..services.conversation_service import ConversationService
from ..services.llm_service import LLMService
from ..schemas.conversation import Message
from datetime import datetime


router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    conversation_id: str
    user_id: str
    content: str


@router.post("/")
async def chat(data: ChatRequest):
    # 1. Add user message
    user_msg = Message(
        conversation_id=data.conversation_id,
        user_id=data.user_id,
        role="user",
        content=data.content,
        created_at=datetime.utcnow(),
    )
    await ConversationService.add_message(data.conversation_id, user_msg)

    # 2. Fetch all messages (ordered)
    messages = await ConversationService.get_messages(data.conversation_id)
    messages_sorted = sorted(messages, key=lambda m: m.created_at)
    openai_msgs = [{"role": m.role, "content": m.content} for m in messages_sorted]

    # 3. Call LLM
    assistant_content = await LLMService.chat(openai_msgs)

    # 4. Store assistant message
    assistant_msg = Message(
        conversation_id=data.conversation_id,
        user_id="assistant",
        role="assistant",
        content=assistant_content,
        created_at=datetime.utcnow(),
    )
    await ConversationService.add_message(data.conversation_id, assistant_msg)

    return {"response": assistant_content}
