import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Patient } from '@/types/patient';
import { toast } from 'sonner';
import { useRiskAssessment } from '@/hooks/useRiskAssessment'; // Import the new hook
import api from '@/utils/api';

interface PatientContextType {
  patients: Patient[];
  selectedPatientId: string | null;
  addPatient: (patient: Omit<Patient, 'id' | 'lastModified' | 'modifiedBy' | 'asaScore' | 'stopBangScore' | 'rcriScore' | 'metsScore' | 'riskCategory' | 'criticalAlerts' | 'preOpRecommendations' | 'completedRecommendations'>) => void;
  updatePatient: (id: string, updatedFields: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  selectPatient: (id: string | null) => void;
  getSelectedPatient: () => Patient | undefined;
  fetchPatients: () => void;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const fetchPatients = async () => {
    try {
      const response = await api.get('/patients');
      setPatients(response.data);
    } catch (error) {
      console.error("Failed to fetch patients", error);
      toast.error("Failed to load patient data.");
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

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

  const addPatient = async (newPatientData: Omit<Patient, 'id' | 'lastModified' | 'modifiedBy' | 'asaScore' | 'stopBangScore' | 'rcriScore' | 'metsScore' | 'riskCategory' | 'criticalAlerts' | 'preOpRecommendations' | 'completedRecommendations'>) => {
    try {
      const patientWithRisk = calculateAndApplyRisk(newPatientData);
      const newPatient: Omit<Patient, 'id'> = {
        ...patientWithRisk,
        lastModified: new Date().toISOString(),
        modifiedBy: localStorage.getItem('currentUser') || 'Unknown User',
        completedRecommendations: [],
      };
      const response = await api.post('/patients', newPatient);
      setPatients((prev) => [...prev, response.data]);
      setSelectedPatientId(response.data.id);
      toast.success(`Patient ${response.data.name} added successfully.`);
      fetchPatients();
    } catch (error) {
      console.error("Failed to add patient", error);
      toast.error("Failed to add patient.");
    }
  };

  const updatePatient = async (id: string, updatedFields: Partial<Patient>) => {
    try {
      const patient = patients.find((p) => p.id === id);
      if (!patient) return;

      const updatedPatientData = {
        ...patient,
        ...updatedFields,
        lastModified: new Date().toISOString(),
        modifiedBy: localStorage.getItem('currentUser') || 'Unknown User',
      };
      
      const recalculatedPatient = calculateAndApplyRisk(updatedPatientData);

      const response = await api.put(`/patients/${id}`, recalculatedPatient);
      setPatients((prev) =>
        prev.map((p) => (p.id === id ? response.data : p))
      );
      toast.success("Patient updated successfully.");
      fetchPatients();
    } catch (error) {
      console.error("Failed to update patient", error);
      toast.error("Failed to update patient.");
    }
  };

  const deletePatient = async (id: string) => {
    try {
      await api.delete(`/patients/${id}`);
      setPatients((prev) => prev.filter((patient) => patient.id !== id));
      if (selectedPatientId === id) {
        setSelectedPatientId(null);
      }
      toast.info("Patient deleted.");
      fetchPatients();
    } catch (error) {
      console.error("Failed to delete patient", error);
      toast.error("Failed to delete patient.");
    }
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
        fetchPatients
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