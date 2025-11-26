from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
import jwt
import os
from db import get_database

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

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
    user["_id"] = str(user["_id"])
    return user