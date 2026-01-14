from ..utils.db import db
from ..schemas.conversation import Conversation, Message
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from .metrics_service import MetricsService


class ConversationService:
    @staticmethod
    async def create_conversation(user_id: str, title: str) -> Conversation:
        doc = {
            "user_id": user_id,
            "title": title,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "messages": [],
        }
        result = await db.conversations.insert_one(doc)
        doc["_id"] = str(result.inserted_id)

        # Track conversation creation
        MetricsService.track_conversation_created()

        return Conversation(**doc)

    @staticmethod
    async def get_conversation(conversation_id: str) -> Optional[Conversation]:
        doc = await db.conversations.find_one({"_id": ObjectId(conversation_id)})
        if doc:
            doc["_id"] = str(doc["_id"])
            return Conversation(**doc)
        return None

    @staticmethod
    async def list_conversations(user_id: str) -> List[Conversation]:
        cursor = db.conversations.find({"user_id": user_id})
        conversations = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            conversations.append(Conversation(**doc))
        return conversations

    @staticmethod
    async def add_message(conversation_id: str, message: Message) -> Message:
        message_dict = message.dict(by_alias=True)
        message_dict["created_at"] = datetime.utcnow()
        if "_id" in message_dict:
            del message_dict["_id"]
        print("[DEBUG] Inserting message into messages collection:", message_dict)
        result = await db.messages.insert_one(message_dict)
        print("[DEBUG] Insert result:", result.inserted_id)
        message_dict["_id"] = str(result.inserted_id)
        await db.conversations.update_one(
            {"_id": ObjectId(conversation_id)},
            {"$set": {"updated_at": datetime.utcnow()}},
        )
        print("[DEBUG] Returning Message:", message_dict)

        # Track message creation
        role = message_dict.get("role", "unknown")
        content_length = len(message_dict.get("content", ""))
        MetricsService.track_message(role=role, content_length=content_length)

        return Message(**message_dict)

    @staticmethod
    async def get_messages(conversation_id: str) -> List[Message]:
        cursor = db.messages.find({"conversation_id": conversation_id})
        messages = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            messages.append(Message(**doc))
        return messages

    @staticmethod
    async def delete_conversation(conversation_id: str) -> bool:
        result = await db.conversations.delete_one({"_id": ObjectId(conversation_id)})
        await db.messages.delete_many({"conversation_id": conversation_id})

        # Track conversation deletion
        if result.deleted_count > 0:
            MetricsService.track_conversation_deleted()

        return result.deleted_count > 0

    @staticmethod
    async def rename_conversation(conversation_id: str, new_title: str) -> bool:
        result = await db.conversations.update_one(
            {"_id": ObjectId(conversation_id)},
            {"$set": {"title": new_title, "updated_at": datetime.utcnow()}},
        )
        return result.modified_count > 0
