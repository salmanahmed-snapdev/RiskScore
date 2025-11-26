from fastapi import APIRouter, HTTPException
from typing import Dict, Any

router = APIRouter()

mock_truform_data: Dict[str, Dict[str, Any]] = {
    "123": {
        "id": "123",
        "name": "John Doe",
        "dateOfBirth": "1990-01-01",
        "medicalHistory": ["Hypertension"],
        "medications": ["Lisinopril"],
        "allergies": ["Peanuts"],
        "surgicalHistory": ["Appendectomy"],
        "mallampatiScore": 1,
        "airwayExamFindings": "Normal",
        "clinicianNotes": "Patient is healthy."
    }
}

@router.get("/api/truform/{id}")
async def get_truform_data(id: str):
    patient_data = mock_truform_data.get(id)
    if patient_data:
        return patient_data
    raise HTTPException(status_code=404, detail="Patient not found")