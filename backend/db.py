import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME", "snapdev-project-db")

if not MONGO_URI:
    print("Warning: MONGODB_URI environment variable not set. Using a placeholder.")
    MONGO_URI = "mongodb://localhost:27017/"

try:
    client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    client.admin.command('ismaster')
    print("Successfully connected to MongoDB.")
except ConnectionFailure as e:
    print(f"Could not connect to MongoDB: {e}")
    client = None
except Exception as e:
    print(f"An unexpected error occurred during MongoDB connection: {e}")
    client = None

def get_database_client():
    return client

async def get_database():
    if client is None:
        # This will be caught by FastAPI's dependency injection system
        # and result in a 500 error. A more robust solution might
        # involve a startup hook to ensure the DB is connected.
        raise ConnectionFailure("Database connection is not available.")
    return client[DB_NAME]