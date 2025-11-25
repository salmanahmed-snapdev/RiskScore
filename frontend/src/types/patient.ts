export interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  medicalHistory: string[];
  medications: string[];
  allergies: string[];
  surgicalHistory: string[];
  mallampatiScore?: number;
  airwayExamFindings?: string;
  asaScore?: number;
  stopBangScore?: number;
  rcriScore?: number;
  metsScore?: number;
  riskCategory?: 'Low' | 'Moderate' | 'High';
  criticalAlerts?: string[];
  preOpRecommendations?: string[];
  completedRecommendations?: string[]; // New field to track completed recommendations
  clinicianNotes?: string;
  lastModified: string;
  modifiedBy: string; // Placeholder for user ID
}