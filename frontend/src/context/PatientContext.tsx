import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Patient } from '@/types/patient';
import { toast } from 'sonner';
import { useRiskAssessment } from '@/hooks/useRiskAssessment'; // Import the new hook

interface PatientContextType {
  patients: Patient[];
  selectedPatientId: string | null;
  addPatient: (patient: Omit<Patient, 'id' | 'lastModified' | 'modifiedBy' | 'asaScore' | 'stopBangScore' | 'rcriScore' | 'metsScore' | 'riskCategory' | 'criticalAlerts' | 'preOpRecommendations' | 'completedRecommendations'>) => void;
  updatePatient: (id: string, updatedFields: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  selectPatient: (id: string | null) => void;
  getSelectedPatient: () => Patient | undefined;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Load patients from localStorage on initial mount
  useEffect(() => {
    try {
      const storedPatients = localStorage.getItem('patients');
      if (storedPatients) {
        setPatients(JSON.parse(storedPatients));
      }
    } catch (error) {
      console.error("Failed to load patients from localStorage", error);
      toast.error("Failed to load patient data.");
    }
  }, []);

  // Save patients to localStorage whenever the patients state changes
  useEffect(() => {
    try {
      localStorage.setItem('patients', JSON.stringify(patients));
    } catch (error) {
      console.error("Failed to save patients to localStorage", error);
      toast.error("Failed to save patient data.");
    }
  }, [patients]);

  // Function to calculate and apply risk assessment
  const calculateAndApplyRisk = (patientData: Omit<Patient, 'id' | 'lastModified' | 'modifiedBy'> | Patient): Patient => {
    // Temporarily create a full patient object for the hook, even if ID is missing for new patients
    const tempPatient: Patient = {
      id: (patientData as Patient).id || `temp-${Date.now()}`, // Use existing ID or temp ID
      name: patientData.name,
      dateOfBirth: patientData.dateOfBirth,
      medicalHistory: patientData.medicalHistory || [],
      medications: patientData.medications || [],
      allergies: patientData.allergies || [],
      surgicalHistory: patientData.surgicalHistory || [],
      mallampatiScore: patientData.mallampatiScore,
      airwayExamFindings: patientData.airwayExamFindings,
      clinicianNotes: patientData.clinicianNotes,
      lastModified: new Date().toISOString(), // Will be overwritten for new patients
      modifiedBy: localStorage.getItem('currentUser') || 'Unknown User', // Will be overwritten for new patients
      // Ensure all fields are present for the hook, even if undefined
      asaScore: (patientData as Patient).asaScore,
      stopBangScore: (patientData as Patient).stopBangScore,
      rcriScore: (patientData as Patient).rcriScore,
      metsScore: (patientData as Patient).metsScore,
      riskCategory: (patientData as Patient).riskCategory,
      criticalAlerts: (patientData as Patient).criticalAlerts || [],
      preOpRecommendations: (patientData as Patient).preOpRecommendations || [],
      completedRecommendations: (patientData as Patient).completedRecommendations || [], // Include new field
    };

    const { asaScore, stopBangScore, rcriScore, metsScore, riskCategory, criticalAlerts, preOpRecommendations } = useRiskAssessment(tempPatient);

    return {
      ...patientData,
      asaScore,
      stopBangScore,
      rcriScore,
      metsScore,
      riskCategory,
      criticalAlerts,
      preOpRecommendations,
      completedRecommendations: (patientData as Patient).completedRecommendations || [], // Preserve existing completed recommendations
    } as Patient; // Cast back to Patient
  };

  const addPatient = (newPatientData: Omit<Patient, 'id' | 'lastModified' | 'modifiedBy' | 'asaScore' | 'stopBangScore' | 'rcriScore' | 'metsScore' | 'riskCategory' | 'criticalAlerts' | 'preOpRecommendations' | 'completedRecommendations'>) => {
    const patientWithRisk = calculateAndApplyRisk(newPatientData);
    const newPatient: Patient = {
      ...patientWithRisk,
      id: `patient-${Date.now()}`, // Simple unique ID
      lastModified: new Date().toISOString(),
      modifiedBy: localStorage.getItem('currentUser') || 'Unknown User',
      completedRecommendations: [], // Initialize as empty for new patients
    };
    setPatients((prev) => [...prev, newPatient]);
    setSelectedPatientId(newPatient.id); // Select the newly added patient
    toast.success(`Patient ${newPatient.name} added successfully.`);
  };

  const updatePatient = (id: string, updatedFields: Partial<Patient>) => {
    setPatients((prev) =>
      prev.map((patient) => {
        if (patient.id === id) {
          const updatedPatientData = {
            ...patient,
            ...updatedFields,
            lastModified: new Date().toISOString(),
            modifiedBy: localStorage.getItem('currentUser') || 'Unknown User',
          };
          // Recalculate risk scores, but preserve completedRecommendations if not explicitly updated
          const recalculatedPatient = calculateAndApplyRisk(updatedPatientData);
          return {
            ...recalculatedPatient,
            completedRecommendations: updatedFields.completedRecommendations !== undefined
              ? updatedFields.completedRecommendations
              : patient.completedRecommendations,
          };
        }
        return patient;
      }),
    );
    toast.success("Patient updated successfully.");
  };

  const deletePatient = (id: string) => {
    setPatients((prev) => prev.filter((patient) => patient.id !== id));
    if (selectedPatientId === id) {
      setSelectedPatientId(null);
    }
    toast.info("Patient deleted.");
  };

  const selectPatient = (id: string | null) => {
    setSelectedPatientId(id);
  };

  const getSelectedPatient = () => {
    return patients.find((patient) => patient.id === selectedPatientId);
  };

  return (
    <PatientContext.Provider
      value={{
        patients,
        selectedPatientId,
        addPatient,
        updatePatient,
        deletePatient,
        selectPatient,
        getSelectedPatient,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
};

export const usePatients = () => {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error('usePatients must be used within a PatientProvider');
  }
  return context;
};