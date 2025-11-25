import { Patient } from '@/types/patient';

interface RiskAssessmentResult {
  asaScore: number | undefined;
  stopBangScore: number | undefined;
  rcriScore: number | undefined;
  metsScore: number | undefined;
  riskCategory: 'Low' | 'Moderate' | 'High' | undefined;
  criticalAlerts: string[];
  preOpRecommendations: string[];
}

export const useRiskAssessment = (patient: Patient | undefined): RiskAssessmentResult => {
  if (!patient) {
    return {
      asaScore: undefined,
      stopBangScore: undefined,
      rcriScore: undefined,
      metsScore: undefined,
      riskCategory: undefined,
      criticalAlerts: [],
      preOpRecommendations: [],
    };
  }

  const medicalHistoryLower = patient.medicalHistory.map(h => h.toLowerCase());
  const medicationsLower = patient.medications.map(m => m.toLowerCase());
  const allergiesLower = patient.allergies.map(a => a.toLowerCase());

  const criticalAlerts: string[] = [];
  const preOpRecommendations: string[] = [];

  // Helper to check for keywords
  const hasMedicalCondition = (keywords: string[]) =>
    keywords.some(keyword => medicalHistoryLower.some(history => history.includes(keyword)));
  const hasMedication = (keywords: string[]) =>
    keywords.some(keyword => medicationsLower.some(med => med.includes(keyword)));
  const hasAllergy = (keywords: string[]) =>
    keywords.some(keyword => allergiesLower.some(allergy => allergy.includes(keyword)));

  // Calculate Age
  let age: number | undefined;
  if (patient.dateOfBirth) {
    const dob = new Date(patient.dateOfBirth);
    const diffMs = Date.now() - dob.getTime();
    const ageDate = new Date(diffMs);
    age = Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  // --- ASA Score Calculation (Simplified) ---
  let asaScore: number = 1;
  if (
    hasMedicalCondition(['hypertension', 'diabetes', 'obesity', 'smoker', 'alcohol']) ||
    patient.surgicalHistory.length > 0
  ) {
    asaScore = Math.max(asaScore, 2); // Mild systemic disease
  }
  if (
    hasMedicalCondition(['poorly controlled hypertension', 'poorly controlled diabetes', 'stable angina', 'prior mi', 'prior cva', 'morbid obesity', 'chronic renal failure', 'moderate copd', 'asthma'])
  ) {
    asaScore = Math.max(asaScore, 3); // Severe systemic disease, not incapacitating
  }
  if (
    hasMedicalCondition(['unstable angina', 'severe copd', 'chf', 'recent mi', 'recent cva', 'end-stage renal disease'])
  ) {
    asaScore = Math.max(asaScore, 4); // Severe systemic disease, constant threat to life
  }

  // --- STOP-Bang Score Calculation (Simplified) ---
  let stopBangScore: number = 0;
  // S: Snoring (assuming if OSA is mentioned or related symptoms)
  if (hasMedicalCondition(['snoring', 'sleep apnea', 'osa'])) stopBangScore++;
  // T: Tiredness (assuming if sleep apnea is mentioned)
  if (hasMedicalCondition(['tiredness', 'fatigue', 'sleepy', 'sleep apnea'])) stopBangScore++;
  // O: Observed apnea
  if (hasMedicalCondition(['observed apnea', 'sleep apnea', 'osa'])) stopBangScore++;
  // P: High blood pressure
  if (hasMedicalCondition(['hypertension', 'high blood pressure'])) stopBangScore++;
  // B: BMI > 35 (assuming 'morbid obesity' in history)
  if (hasMedicalCondition(['morbid obesity'])) stopBangScore++;
  // A: Age > 50
  if (age !== undefined && age > 50) stopBangScore++;
  // N: Neck circumference (skipped for now as not in patient type)
  // G: Gender (skipped for now as not in patient type)

  // --- RCRI Score Calculation (Simplified) ---
  let rcriScore: number = 0;
  // History of ischemic heart disease
  if (hasMedicalCondition(['ischemic heart disease', 'mi', 'angina', 'cad'])) rcriScore++;
  // History of congestive heart failure
  if (hasMedicalCondition(['congestive heart failure', 'chf'])) rcriScore++;
  // History of cerebrovascular disease
  if (hasMedicalCondition(['cerebrovascular disease', 'cva', 'tia'])) rcriScore++;
  // Preoperative treatment with insulin
  if (hasMedication(['insulin'])) rcriScore++;
  // Preoperative serum creatinine > 2.0 mg/dL (skipped for now)

  // --- METs Score Calculation (Simplified) ---
  let metsScore: number = 0; // 0-3 for poor functional capacity, 4+ for good
  if (hasMedicalCondition(['chf', 'severe copd', 'unstable angina', 'end-stage renal disease'])) {
    metsScore = 0; // Very poor functional capacity
  } else if (hasMedicalCondition(['moderate copd', 'stable angina', 'prior mi', 'prior cva'])) {
    metsScore = 2; // Limited functional capacity
  } else {
    metsScore = 4; // Assumed good functional capacity otherwise
  }

  // --- Critical Alerts ---
  if (hasMedication(['warfarin', 'heparin', 'rivaroxaban', 'apixaban', 'dabigatran', 'edoxaban'])) {
    criticalAlerts.push('Active anticoagulants');
    preOpRecommendations.push('INR/PTT check');
  }
  if (hasAllergy(['anaphylaxis', 'severe allergy'])) {
    criticalAlerts.push('Severe allergies');
  }
  if (stopBangScore >= 3 || hasMedicalCondition(['obstructive sleep apnea', 'osa'])) {
    criticalAlerts.push('Diagnosed Obstructive Sleep Apnea (OSA)');
    preOpRecommendations.push('Sleep Study (if not recent)');
  }
  if (patient.mallampatiScore && patient.mallampatiScore >= 3) {
    criticalAlerts.push(`Significant airway issue (Mallampati Score ${patient.mallampatiScore})`);
  }
  if (hasMedicalCondition(['uncontrolled hypertension', 'hypertensive crisis'])) {
    criticalAlerts.push('Uncontrolled Hypertension');
    preOpRecommendations.push('BP optimization');
  }
  if (hasMedicalCondition(['uncontrolled diabetes', 'diabetic ketoacidosis'])) {
    criticalAlerts.push('Uncontrolled Diabetes');
    preOpRecommendations.push('HbA1c, Glucose optimization');
  }
  if (hasMedicalCondition(['recent mi', 'recent cva'])) {
    criticalAlerts.push('Recent MI/CVA');
    preOpRecommendations.push('Cardiac/Neurology consult');
  }
  if (hasMedicalCondition(['pregnancy'])) {
    criticalAlerts.push('Patient is pregnant');
    preOpRecommendations.push('OB clearance');
  }

  // --- Pre-operative Recommendations (General) ---
  if (asaScore >= 3 || rcriScore >= 1 || (age !== undefined && age > 50 && hasMedicalCondition(['hypertension', 'diabetes']))) {
    if (!preOpRecommendations.includes('EKG')) preOpRecommendations.push('EKG');
  }
  if (hasMedicalCondition(['anemia', 'bleeding disorder'])) {
    if (!preOpRecommendations.includes('CBC')) preOpRecommendations.push('CBC');
  }
  if (hasMedicalCondition(['diabetes'])) {
    if (!preOpRecommendations.includes('HbA1c')) preOpRecommendations.push('HbA1c');
  }
  if (hasMedicalCondition(['renal failure', 'liver disease', 'electrolyte imbalance'])) {
    if (!preOpRecommendations.includes('CMP')) preOpRecommendations.push('CMP');
  }

  // --- Risk Category Determination ---
  let riskCategory: 'Low' | 'Moderate' | 'High' = 'Low';
  if (asaScore >= 4 || criticalAlerts.length > 0 || stopBangScore >= 5 || rcriScore >= 3 || metsScore < 2) {
    riskCategory = 'High';
  } else if (asaScore >= 3 || stopBangScore >= 3 || rcriScore >= 1 || metsScore < 4) {
    riskCategory = 'Moderate';
  }

  return {
    asaScore,
    stopBangScore,
    rcriScore,
    metsScore,
    riskCategory,
    criticalAlerts,
    preOpRecommendations,
  };
};