import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
# from pymongo import MongoClient
from motor.motor_asyncio import AsyncIOMotorClient

from pymongo.errors import ConnectionFailure
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://localhost:5137",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME", "snapdev-project-db")
if not MONGO_URI:
    # This will be handled by the environment, but as a safeguard:
    print("Warning: MONGODB_URI environment variable not set. Using a placeholder.")
    MONGO_URI = "mongodb://localhost:27017/" # Placeholder

try:
    client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    # The ismaster command is cheap and does not require auth.
    client.admin.command('ismaster')
    print("Successfully connected to MongoDB.")
except ConnectionFailure as e:
    print(f"Could not connect to MongoDB: {e}")
    # We don't raise an exception here to allow the app to start,
    # but the health check will fail.
    client = None
except Exception as e:
    print(f"An unexpected error occurred during MongoDB connection: {e}")
    client = None
    
    
async def get_database():
    if client is None:
        raise HTTPException(status_code=503, detail="Database connection is not available.")
    return client[DB_NAME]


@app.get("/api/v1/healthz")
def health_check():
    if client is None:
        raise HTTPException(status_code=503, detail="Database connection not configured")
    try:
        # The ismaster command is cheap and does not require auth.
        client.admin.command('ismaster')
        return {"status": "ok", "database": "connected"}
    except ConnectionFailure as e:
        raise HTTPException(status_code=503, detail=f"Database connection failed: {e}")

from routes import auth, patients

app.include_router(auth.router, prefix="/api/v1")
app.include_router(patients.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Welcome to the API"}