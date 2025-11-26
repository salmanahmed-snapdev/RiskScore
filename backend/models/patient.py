from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from bson import ObjectId

class Patient(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str
    dateOfBirth: str
    medicalHistory: Optional[List[str]] = []
    medications: Optional[List[str]] = []
    allergies: Optional[List[str]] = []
    surgicalHistory: Optional[List[str]] = []
    mallampatiScore: Optional[int] = None
    airwayExamFindings: Optional[str] = None
    clinicianNotes: Optional[str] = None
    asaScore: Optional[int] = None
    stopBangScore: Optional[int] = None
    rcriScore: Optional[int] = None
    metsScore: Optional[int] = None
    riskCategory: Optional[str] = None
    criticalAlerts: Optional[List[str]] = []
    preOpRecommendations: Optional[List[str]] = []
    completedRecommendations: Optional[List[str]] = []
    lastModified: Optional[datetime] = None
    modifiedBy: Optional[str] = None

    class Config:
        collection = "patients"
        populate_by_name = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat(),
            ObjectId: str
        }

class PatientOut(Patient):
    id: str
