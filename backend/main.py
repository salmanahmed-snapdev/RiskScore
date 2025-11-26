import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo.errors import ConnectionFailure
from dotenv import load_dotenv

from db import get_database_client

load_dotenv()

app = FastAPI()

# CORS configuration
origins = [
    "https://riskscore-jjvw.onrender.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
client = get_database_client()


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