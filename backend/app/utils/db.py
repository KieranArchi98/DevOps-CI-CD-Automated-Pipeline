# Hardcoded MongoDB Atlas URI for testing
import os

from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DB", "genesis")

client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]
