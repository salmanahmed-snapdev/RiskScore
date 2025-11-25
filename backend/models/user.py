from pydantic import BaseModel, Field
from typing import Optional

class User(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str
    email: str
    google_id: str

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "name": "Dr. Jane Doe",
                "email": "jane.doe@gmail.com",
                "google_id": "10987654321"
            }
        }

class UserInDB(User):
    pass