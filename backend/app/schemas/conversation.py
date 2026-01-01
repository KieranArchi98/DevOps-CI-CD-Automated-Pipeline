from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class Message(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    conversation_id: str
    user_id: str
    role: str  # 'user' or 'assistant'
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Conversation(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    title: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    messages: Optional[List[Message]] = []
