import React from 'react';
import { Patient } from '@/types/patient';
import { Separator } from '@/components/ui/separator';
import { Check, X } from 'lucide-react'; // Import icons for status

interface ReportGeneratorProps {
  patient: Patient;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ patient }) => {
  return (
    <div className="p-8 bg-white text-gray-900" style={{ width: '800px', minHeight: '1100px' }}> {/* Standard A4 width */}
      <h1 className="text-3xl font-bold text-center mb-6">Anesthesia Risk Assessment Report</h1>
      <p className="text-sm text-gray-600 text-center mb-8">Generated on: {new Date().toLocaleString()}</p>

      {/* Patient Demographics */}
      <div className="mb-8 border p-4 rounded-md">
        <h2 className="text-xl font-semibold mb-4">Patient Demographics</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <p><strong>Name:</strong> {patient.name}</p>
          <p><strong>Date of Birth:</strong> {patient.dateOfBirth}</p>
          <p><strong>Last Modified:</strong> {new Date(patient.lastModified).toLocaleString()}</p>
          <p><strong>Modified By:</strong> {patient.modifiedBy}</p>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Medical Information */}
      <div className="mb-8 border p-4 rounded-md">
        <h2 className="text-xl font-semibold mb-4">Medical Information</h2>
        <div className="space-y-2 text-sm">
          <p><strong>Medical History:</strong> {patient.medicalHistory.join(', ') || 'N/A'}</p>
          <p><strong>Current Medications:</strong> {patient.medications.join(', ') || 'N/A'}</p>
          <p><strong>Known Allergies:</strong> {patient.allergies.join(', ') || 'N/A'}</p>
          <p><strong>Surgical History:</strong> {patient.surgicalHistory.join(', ') || 'N/A'}</p>
          <p><strong>Mallampati Score:</strong> {patient.mallampatiScore || 'N/A'}</p>
          <p><strong>Airway Exam Findings:</strong> {patient.airwayExamFindings || 'N/A'}</p>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Risk Scores */}
      <div className="mb-8 border p-4 rounded-md">
        <h2 className="text-xl font-semibold mb-4">Anesthesia Risk Scores</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <p><strong>ASA Score:</strong> {patient.asaScore || 'N/A'}</p>
          <p><strong>STOP-Bang Score:</strong> {patient.stopBangScore || 'N/A'}</p>
          <p><strong>RCRI Score:</strong> {patient.rcriScore || 'N/A'}</p>
          <p><strong>METs Score:</strong> {patient.metsScore || 'N/A'}</p>
          <p>
            <strong>Overall Risk Category:</strong>{' '}
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                patient.riskCategory === 'High'
                  ? 'bg-red-100 text-red-800'
                  : patient.riskCategory === 'Moderate'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {patient.riskCategory || 'N/A'}
            </span>
          </p>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Critical Alerts */}
      <div className="mb-8 border p-4 rounded-md">
        <h2 className="text-xl font-semibold mb-4">Critical Alerts</h2>
        {patient.criticalAlerts && patient.criticalAlerts.length > 0 ? (
          <ul className="list-disc pl-5 text-red-700 text-sm">
            {patient.criticalAlerts.map((alert, index) => (
              <li key={index}>{alert}</li>
            ))}
          </ul>
        ) : (
          <p className="text-green-700 text-sm">No critical alerts identified.</p>
        )}
      </div>

      <Separator className="my-6" />

      {/* Pre-operative Recommendations */}
      <div className="mb-8 border p-4 rounded-md">
        <h2 className="text-xl font-semibold mb-4">Pre-operative Recommendations</h2>
        {patient.preOpRecommendations && patient.preOpRecommendations.length > 0 ? (
          <ul className="space-y-1 text-sm">
            {patient.preOpRecommendations.map((rec, index) => (
              <li key={index} className="flex items-center">
                {patient.completedRecommendations?.includes(rec) ? (
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                ) : (
                  <X className="h-4 w-4 mr-2 text-red-600" />
                )}
                {rec}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm">No specific pre-operative recommendations.</p>
        )}
      </div>

      <Separator className="my-6" />

      {/* Clinician Notes */}
      <div className="mb-8 border p-4 rounded-md">
        <h2 className="text-xl font-semibold mb-4">Clinician Notes</h2>
        <p className="text-sm whitespace-pre-wrap">{patient.clinicianNotes || 'N/A'}</p>
      </div>

      <div className="text-center text-xs text-gray-500 mt-10">
        This report is for informational purposes only and should not replace professional medical judgment.
      </div>
    </div>
  );
};

export default ReportGenerator;