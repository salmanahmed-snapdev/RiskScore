from fastapi import APIRouter, HTTPException, Depends
from typing import List
from models.patient import Patient, PatientOut
from main import get_database
from routes.auth import get_current_user
from models.user import User
from datetime import datetime
from bson import ObjectId
from services.risk_assessment import assess_risk
from fpdf import FPDF
from fastapi.responses import StreamingResponse
import io

router = APIRouter()

@router.get("/patients", response_model=List[PatientOut])
async def get_patients(db=Depends(get_database), current_user: User = Depends(get_current_user)):
    patients = await db.patients.find().to_list(100)
    return [PatientOut(**p, id=str(p["_id"])) for p in patients]

@router.post("/patients", response_model=PatientOut)
async def create_patient(patient: Patient, db=Depends(get_database), current_user: User = Depends(get_current_user)):
    patient_data = patient.model_dump(exclude={"id"}, by_alias=True)
 
    history_fields = ["medicalHistory", "medications", "allergies", "surgicalHistory"]
    for field in history_fields:
        if isinstance(patient_data.get(field), str):
            patient_data[field] = [item.strip() for item in patient_data[field].split(',') if item.strip()]
    risk_assessment = assess_risk(patient_data)
    patient_data.update(risk_assessment)
    
    patient_data['modifiedBy'] = current_user['google_id']
    patient_data['lastModified'] = datetime.now()
    
    new_patient = await db.patients.insert_one(patient_data)
    created_patient = await db.patients.find_one({"_id": new_patient.inserted_id})
    return PatientOut(**created_patient, id=str(created_patient["_id"]))

@router.get("/patients/{patient_id}", response_model=PatientOut)
async def get_patient(patient_id: str, db=Depends(get_database), current_user: User = Depends(get_current_user)):
    patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return PatientOut(**patient, id=str(patient["_id"]))

@router.put("/patients/{patient_id}", response_model=PatientOut)
async def update_patient(patient_id: str, patient: Patient, db=Depends(get_database), current_user: User = Depends(get_current_user)):
    patient_data = patient.model_dump(by_alias=True, exclude={"id"})

    history_fields = ["medicalHistory", "medications", "allergies", "surgicalHistory"]
    for field in history_fields:
        if isinstance(patient_data.get(field), str):
            patient_data[field] = [item.strip() for item in patient_data[field].split(',') if item.strip()]
    risk_assessment = assess_risk(patient_data)
    patient_data.update(risk_assessment)

    patient_data['modifiedBy'] = current_user['google_id']
    patient_data['lastModified'] = datetime.now()

    await db.patients.update_one({"_id": ObjectId(patient_id)}, {"$set": patient_data})
    updated_patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
    if updated_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return PatientOut(**updated_patient, id=str(updated_patient["_id"]))

@router.delete("/patients/{patient_id}")
async def delete_patient(patient_id: str, db=Depends(get_database), current_user: User = Depends(get_current_user)):
    delete_result = await db.patients.delete_one({"_id": ObjectId(patient_id)})
    if delete_result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Patient not found")
    return {"message": "Patient deleted successfully"}

@router.post("/patients/{patient_id}/generate-report")
async def generate_report(patient_id: str, db=Depends(get_database), current_user: User = Depends(get_current_user)):
    if not ObjectId.is_valid(patient_id):
        raise HTTPException(status_code=404, detail="Patient not found")
    patient = await db.patients.find_one({"_id": ObjectId(patient_id)})
    patient["id"] = str(patient["_id"])
    patient["_id"] = str(patient["_id"])
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    
    pdf.cell(200, 10, txt="Patient Risk Profile", ln=True, align='C')
    
    # Add patient details
    pdf.cell(200, 10, txt=f"Name: {patient.get('name', 'N/A')}", ln=True)
    pdf.cell(200, 10, txt=f"Date of Birth: {patient.get('dateOfBirth', 'N/A')}", ln=True)
    
    # Add risk scores
    pdf.cell(200, 10, txt=f"ASA Score: {patient.get('asaScore', 'N/A')}", ln=True)
    pdf.cell(200, 10, txt=f"STOP-Bang Score: {patient.get('stopBangScore', 'N/A')}", ln=True)
    pdf.cell(200, 10, txt=f"RCRI Score: {patient.get('rcriScore', 'N/A')}", ln=True)
    pdf.cell(200, 10, txt=f"METs Score: {patient.get('metsScore', 'N/A')}", ln=True)
    
    # Add risk category
    pdf.cell(200, 10, txt=f"Risk Category: {patient.get('riskCategory', 'N/A')}", ln=True)
    
    # Add critical alerts
    pdf.cell(200, 10, txt="Critical Alerts:", ln=True)
    for alert in patient.get('criticalAlerts', []):
        pdf.cell(200, 10, txt=f"- {alert}", ln=True)
        
    # Add recommendations
    pdf.cell(200, 10, txt="Pre-Op Recommendations:", ln=True)
    for recommendation in patient.get('preOpRecommendations', []):
        pdf.cell(200, 10, txt=f"- {recommendation}", ln=True)

    pdf_output = pdf.output(dest='S')
    
    return StreamingResponse(io.BytesIO(pdf_output), media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=patient_{patient_id}_risk_profile.pdf"})