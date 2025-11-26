import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PatientProvider, usePatients } from '@/context/PatientContext';
import PatientForm from '@/components/PatientForm';
import PatientList from '@/components/PatientList';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { FileText, Download, AlertCircle, CheckCircle, History } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/utils/api';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge'; // Import Badge component

const DashboardContent = () => {
  const { getSelectedPatient, selectedPatientId, selectPatient, updatePatient } = usePatients();
  const selectedPatient = getSelectedPatient();
  const [isEditing, setIsEditing] = useState(false);

  const handleAddPatientClick = () => {
    selectPatient(null);
    setIsEditing(false);
  };

  const handleEditPatientClick = (patientId: string) => {
    selectPatient(patientId);
    setIsEditing(true);
  };

  const handleFormSubmitSuccess = () => {
    setIsEditing(false);
  };

  const handleRecommendationToggle = (recommendation: string, checked: boolean) => {
    if (!selectedPatient) return;

    const updatedCompletedRecommendations = checked
      ? [...(selectedPatient.completedRecommendations || []), recommendation]
      : (selectedPatient.completedRecommendations || []).filter(
          (rec) => rec !== recommendation
        );

    updatePatient(selectedPatient.id, { completedRecommendations: updatedCompletedRecommendations });
  };

  const handleGenerateReport = async () => {
    if (!selectedPatient) {
      toast.error("Please select a patient to generate a report.");
      return;
    }

    toast.info(`Generating PDF report for ${selectedPatient.name}...`);

    try {
      console.log(selectedPatient)
      const response = await api.post(
        `/patients/${selectedPatient.id}/generate-report`,
        {},
        {
          responseType: 'blob', // Important for handling file downloads
        }
      );

      // Create a blob from the response
      const blob = new Blob([response.data], { type: 'application/pdf' });

      // Create a link element to trigger the download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `Anesthesia_Risk_Report_${selectedPatient.name.replace(/\s/g, '_')}.pdf`
      );

      // Append to the document, click, and then remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`PDF report for ${selectedPatient.name} generated and downloaded.`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF report. Please try again.");
    }
  };

  // Helper function for badge variant (can be moved to a utility if used more widely)
  const getRiskBadgeVariant = (riskCategory: string | undefined) => {
    switch (riskCategory) {
      case 'High':
        return 'destructive';
      case 'Moderate':
        return 'secondary';
      case 'Low':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Anesthesia Risk Assessment Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient List / Selection */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Patient List</CardTitle>
              </CardHeader>
              <CardContent>
                <PatientList onEditPatient={handleEditPatientClick} onAddPatient={handleAddPatientClick} />
              </CardContent>
            </Card>
          </div>

          {/* Patient Details / Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{selectedPatientId && isEditing ? 'Edit Patient Data' : selectedPatientId ? 'Patient Details' : 'Add New Patient'}</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedPatientId && !isEditing && selectedPatient ? (
                  // Display Patient Details
                  <div className="space-y-4">
                    <p><strong>Name:</strong> {selectedPatient.name}</p>
                    <p><strong>Date of Birth:</strong> {selectedPatient.dateOfBirth}</p>
                    <p><strong>Medical History:</strong> {selectedPatient.medicalHistory.join(', ') || 'N/A'}</p>
                    <p><strong>Medications:</strong> {selectedPatient.medications.join(', ') || 'N/A'}</p>
                    <p><strong>Allergies:</strong> {selectedPatient.allergies.join(', ') || 'N/A'}</p>
                    <p><strong>Surgical History:</strong> {selectedPatient.surgicalHistory.join(', ') || 'N/A'}</p>
                    <p><strong>Mallampati Score:</strong> {selectedPatient.mallampatiScore || 'N/A'}</p>
                    <p><strong>Airway Exam Findings:</strong> {selectedPatient.airwayExamFindings || 'N/A'}</p>
                    <p><strong>Clinician Notes:</strong> {selectedPatient.clinicianNotes || 'N/A'}</p>
                    <Button onClick={() => setIsEditing(true)} className="mt-4">
                      <FileText className="mr-2 h-4 w-4" /> Edit Patient
                    </Button>
                  </div>
                ) : (
                  // Display Patient Form for Add/Edit
                  <PatientForm patientToEdit={selectedPatientId && isEditing ? selectedPatient : undefined} onFormSubmitSuccess={handleFormSubmitSuccess} />
                )}
              </CardContent>
            </Card>

            {selectedPatient && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Risk Scores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Automated ASA, STOP-Bang, RCRI, METs scores.</p>
                    <div className="mt-4 p-4 border rounded-md bg-muted">
                      <p><strong>ASA Score:</strong> {selectedPatient.asaScore || 'N/A'}</p>
                      <p><strong>STOP-Bang Score:</strong> {selectedPatient.stopBangScore || 'N/A'}</p>
                      <p><strong>RCRI Score:</strong> {selectedPatient.rcriScore || 'N/A'}</p>
                      <p><strong>METs Score:</strong> {selectedPatient.metsScore || 'N/A'}</p>
                      <p className="flex items-center">
                        <strong className="mr-2">Risk Category:</strong>{' '}
                        <Badge variant={getRiskBadgeVariant(selectedPatient.riskCategory)}>
                          {selectedPatient.riskCategory || 'N/A'}
                        </Badge>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations & Alerts</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Pre-operative test recommendations and critical alerts.</p>
                    <div className="mt-4 p-4 border rounded-md bg-muted space-y-2">
                      <div>
                        <h4 className="font-semibold flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2 text-red-500" /> Critical Alerts:
                        </h4>
                        {selectedPatient.criticalAlerts && selectedPatient.criticalAlerts.length > 0 ? (
                          <ul className="list-disc pl-5 text-red-700 dark:text-red-300">
                            {selectedPatient.criticalAlerts.map((alert, index) => (
                              <li key={index}>{alert}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-green-700 dark:text-green-300 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2" /> No critical alerts.
                          </p>
                        )}
                      </div>
                      <Separator />
                      <div>
                        <h4 className="font-semibold flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-blue-500" /> Pre-op Recommendations:
                        </h4>
                        {selectedPatient.preOpRecommendations && selectedPatient.preOpRecommendations.length > 0 ? (
                          <ul className="space-y-2">
                            {selectedPatient.preOpRecommendations.map((rec, index) => (
                              <li key={index} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`rec-${index}`}
                                  checked={selectedPatient.completedRecommendations?.includes(rec)}
                                  onCheckedChange={(checked) => handleRecommendationToggle(rec, checked as boolean)}
                                />
                                <label
                                  htmlFor={`rec-${index}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {rec}
                                </label>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>None.</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <History className="h-5 w-5 mr-2" /> Audit Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p><strong>Last Modified:</strong> {new Date(selectedPatient.lastModified).toLocaleString()}</p>
                    <p><strong>Modified By:</strong> {selectedPatient.modifiedBy}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Reporting</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Generate and export a PDF report for OMS Vision records.</p>
                    <Button onClick={handleGenerateReport} className="mt-4">
                      <Download className="mr-2 h-4 w-4" /> Generate PDF Report
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

const Dashboard = () => (
  <PatientProvider>
    <DashboardContent />
  </PatientProvider>
);

export default Dashboard;