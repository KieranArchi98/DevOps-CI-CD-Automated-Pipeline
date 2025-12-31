# Hardcoded MongoDB Atlas URI for testing
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URI = 'mongodb+srv://veximity:432e1adcbf@cluster0.oail340.mongodb.net/?appName=Cluster0'
DB_NAME = 'chatbot'

client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]