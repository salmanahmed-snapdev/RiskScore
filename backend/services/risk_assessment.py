from datetime import datetime

def assess_risk(patient):
    if not patient:
        return {
            "asaScore": None,
            "stopBangScore": None,
            "rcriScore": None,
            "metsScore": None,
            "riskCategory": None,
            "criticalAlerts": [],
            "preOpRecommendations": [],
        }

    medical_history_lower = [h.lower() for h in patient.get('medicalHistory', [])]
    medications_lower = [m.lower() for m in patient.get('medications', [])]
    allergies_lower = [a.lower() for a in patient.get('allergies', [])]
    surgical_history = patient.get('surgicalHistory', [])
    mallampati_score = patient.get('mallampatiScore')
    date_of_birth = patient.get('dateOfBirth')

    critical_alerts = []
    pre_op_recommendations = []

    def has_medical_condition(keywords):
        return any(any(keyword in history for history in medical_history_lower) for keyword in keywords)

    def has_medication(keywords):
        return any(any(keyword in med for med in medications_lower) for keyword in keywords)

    def has_allergy(keywords):
        return any(any(keyword in allergy for allergy in allergies_lower) for keyword in keywords)

    age = None
    if date_of_birth:
        try:
            # Assuming date_of_birth is in ISO format 'YYYY-MM-DDTHH:MM:SS.sssZ'
            dob = datetime.fromisoformat(date_of_birth.replace('Z', '+00:00'))
            today = datetime.utcnow().replace(tzinfo=dob.tzinfo)
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        except (ValueError, TypeError):
            age = None # Handle cases with invalid date format


    # --- ASA Score Calculation (Simplified) ---
    asa_score = 1
    if has_medical_condition(['hypertension', 'diabetes', 'obesity', 'smoker', 'alcohol']) or surgical_history:
        asa_score = max(asa_score, 2)
    if has_medical_condition(['poorly controlled hypertension', 'poorly controlled diabetes', 'stable angina', 'prior mi', 'prior cva', 'morbid obesity', 'chronic renal failure', 'moderate copd', 'asthma']):
        asa_score = max(asa_score, 3)
    if has_medical_condition(['unstable angina', 'severe copd', 'chf', 'recent mi', 'recent cva', 'end-stage renal disease']):
        asa_score = max(asa_score, 4)

    # --- STOP-Bang Score Calculation (Simplified) ---
    stop_bang_score = 0
    if has_medical_condition(['snoring', 'sleep apnea', 'osa']): stop_bang_score += 1
    if has_medical_condition(['tiredness', 'fatigue', 'sleepy', 'sleep apnea']): stop_bang_score += 1
    if has_medical_condition(['observed apnea', 'sleep apnea', 'osa']): stop_bang_score += 1
    if has_medical_condition(['hypertension', 'high blood pressure']): stop_bang_score += 1
    if has_medical_condition(['morbid obesity']): stop_bang_score += 1
    if age is not None and age > 50: stop_bang_score += 1

    # --- RCRI Score Calculation (Simplified) ---
    rcri_score = 0
    if has_medical_condition(['ischemic heart disease', 'mi', 'angina', 'cad']): rcri_score += 1
    if has_medical_condition(['congestive heart failure', 'chf']): rcri_score += 1
    if has_medical_condition(['cerebrovascular disease', 'cva', 'tia']): rcri_score += 1
    if has_medication(['insulin']): rcri_score += 1

    # --- METs Score Calculation (Simplified) ---
    mets_score = 4
    if has_medical_condition(['chf', 'severe copd', 'unstable angina', 'end-stage renal disease']):
        mets_score = 0
    elif has_medical_condition(['moderate copd', 'stable angina', 'prior mi', 'prior cva']):
        mets_score = 2

    # --- Critical Alerts ---
    if has_medication(['warfarin', 'heparin', 'rivaroxaban', 'apixaban', 'dabigatran', 'edoxaban']):
        critical_alerts.append('Active anticoagulants')
        pre_op_recommendations.append('INR/PTT check')
    if has_allergy(['anaphylaxis', 'severe allergy']):
        critical_alerts.append('Severe allergies')
    if stop_bang_score >= 3 or has_medical_condition(['obstructive sleep apnea', 'osa']):
        critical_alerts.append('Diagnosed Obstructive Sleep Apnea (OSA)')
        if 'Sleep Study (if not recent)' not in pre_op_recommendations:
            pre_op_recommendations.append('Sleep Study (if not recent)')
    if mallampati_score and mallampati_score >= 3:
        critical_alerts.append(f'Significant airway issue (Mallampati Score {mallampati_score})')
    if has_medical_condition(['uncontrolled hypertension', 'hypertensive crisis']):
        critical_alerts.append('Uncontrolled Hypertension')
        pre_op_recommendations.append('BP optimization')
    if has_medical_condition(['uncontrolled diabetes', 'diabetic ketoacidosis']):
        critical_alerts.append('Uncontrolled Diabetes')
        pre_op_recommendations.append('HbA1c, Glucose optimization')
    if has_medical_condition(['recent mi', 'recent cva']):
        critical_alerts.append('Recent MI/CVA')
        pre_op_recommendations.append('Cardiac/Neurology consult')
    if has_medical_condition(['pregnancy']):
        critical_alerts.append('Patient is pregnant')
        pre_op_recommendations.append('OB clearance')

    # --- Pre-operative Recommendations (General) ---
    if asa_score >= 3 or rcri_score >= 1 or (age is not None and age > 50 and has_medical_condition(['hypertension', 'diabetes'])):
        if 'EKG' not in pre_op_recommendations: pre_op_recommendations.append('EKG')
    if has_medical_condition(['anemia', 'bleeding disorder']):
        if 'CBC' not in pre_op_recommendations: pre_op_recommendations.append('CBC')
    if has_medical_condition(['diabetes']):
        if 'HbA1c' not in pre_op_recommendations: pre_op_recommendations.append('HbA1c')
    if has_medical_condition(['renal failure', 'liver disease', 'electrolyte imbalance']):
        if 'CMP' not in pre_op_recommendations: pre_op_recommendations.append('CMP')

    # --- Risk Category Determination ---
    risk_category = 'Low'
    if asa_score >= 4 or critical_alerts or stop_bang_score >= 5 or rcri_score >= 3 or mets_score < 2:
        risk_category = 'High'
    elif asa_score >= 3 or stop_bang_score >= 3 or rcri_score >= 1 or mets_score < 4:
        risk_category = 'Moderate'

    return {
        "asaScore": asa_score,
        "stopBangScore": stop_bang_score,
        "rcriScore": rcri_score,
        "metsScore": mets_score,
        "riskCategory": risk_category,
        "criticalAlerts": list(set(critical_alerts)),
        "preOpRecommendations": list(set(pre_op_recommendations)),
    }