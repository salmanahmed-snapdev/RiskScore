from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
import httpx
import jwt
import os
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from models.user import User
from main import get_database

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class Token(BaseModel):
    access_token: str
    token_type: str

class GoogleAuthCode(BaseModel):
    code: str

@router.post("/auth/google", response_model=Token)
async def auth_google(auth_code: GoogleAuthCode, db = Depends(get_database)):
    GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.environ.get("GOOGLE_CLIENT_SECRET")
    JWT_SECRET = os.environ.get("JWT_SECRET")
    
    token_url = "https://oauth2.googleapis.com/token"
    redirect_uri = "http://localhost:5137/auth/callback"
        
    data = {
        "code": auth_code.code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code"
    }
    
    async with httpx.AsyncClient() as http_client:
        token_response = await http_client.post(token_url, data=data)
    
    token_json = token_response.json()
    
    if "access_token" not in token_json:
        raise HTTPException(status_code=400, detail="Invalid token from Google")
        
    access_token = token_json["access_token"]
    
    user_info_url = "https://www.googleapis.com/oauth2/v1/userinfo"
    headers = {"Authorization": f"Bearer {access_token}"}
    
    async with httpx.AsyncClient() as http_client:
        user_response = await http_client.get(user_info_url, headers=headers)
    
    user_info = user_response.json()
    
    
    # Check if user exists
    user = await db.users.find_one({"google_id": user_info["id"]})
    
    if user is None:
        # Create user
        new_user = User(
            name=user_info["name"],
            email=user_info["email"],
            google_id=user_info["id"]
        )
        await db.users.insert_one(new_user.model_dump(by_alias=True))
        user = new_user
    
    jwt_payload = {
        "sub": user_info["id"],
        "exp": datetime.utcnow() + timedelta(hours=1)
    }
    
    jwt_token = jwt.encode(jwt_payload, JWT_SECRET, algorithm="HS256")
    
    return {"access_token": jwt_token, "token_type": "bearer"}


async def get_current_user(token: str = Depends(oauth2_scheme), db = Depends(get_database)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        JWT_SECRET = os.environ.get("JWT_SECRET")
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        google_id: str = payload.get("sub")
        if google_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"google_id": google_id})
    if user is None:
        raise credentials_exception
    return user


@router.get("/auth/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user