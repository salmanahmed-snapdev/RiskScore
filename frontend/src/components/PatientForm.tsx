import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Patient } from '@/types/patient';
import { usePatients } from '@/context/PatientContext';
import { toast } from 'sonner';
import { fetchTruformPatient } from '@/utils/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Import Select components

const patientFormSchema = z.object({
  name: z.string().min(1, { message: 'Patient name is required.' }),
  dateOfBirth: z.string().min(1, { message: 'Date of birth is required.' }),
  medicalHistory: z.string().optional(),
  medications: z.string().optional(),
  allergies: z.string().optional(),
  surgicalHistory: z.string().optional(),
  mallampatiScore: z.coerce.number().min(1).max(4).optional().nullable(),
  airwayExamFindings: z.string().optional(),
  clinicianNotes: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

interface PatientFormProps {
  patientToEdit?: Patient;
  onFormSubmitSuccess?: () => void;
}

const PatientForm: React.FC<PatientFormProps> = ({ patientToEdit, onFormSubmitSuccess }) => {
  const { addPatient, updatePatient, selectPatient } = usePatients();

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      name: '',
      dateOfBirth: '',
      medicalHistory: '',
      medications: '',
      allergies: '',
      surgicalHistory: '',
      mallampatiScore: undefined,
      airwayExamFindings: '',
      clinicianNotes: '',
    },
  });

  useEffect(() => {
    if (patientToEdit) {
      form.reset({
        name: patientToEdit.name,
        dateOfBirth: patientToEdit.dateOfBirth,
        medicalHistory: patientToEdit.medicalHistory.join(', '),
        medications: patientToEdit.medications.join(', '),
        allergies: patientToEdit.allergies.join(', '),
        surgicalHistory: patientToEdit.surgicalHistory.join(', '),
        mallampatiScore: patientToEdit.mallampatiScore,
        airwayExamFindings: patientToEdit.airwayExamFindings,
        clinicianNotes: patientToEdit.clinicianNotes,
      });
    } else {
      form.reset();
    }
  }, [patientToEdit, form]);

  const onSubmit = (values: PatientFormValues) => {
    const patientData = {
      ...values,
      medicalHistory: values.medicalHistory ? values.medicalHistory.split(',').map(s => s.trim()) : [],
      medications: values.medications ? values.medications.split(',').map(s => s.trim()) : [],
      allergies: values.allergies ? values.allergies.split(',').map(s => s.trim()) : [],
      surgicalHistory: values.surgicalHistory ? values.surgicalHistory.split(',').map(s => s.trim()) : [],
    };

    if (patientToEdit) {
      updatePatient(patientToEdit.id, patientData);
    } else {
      addPatient(patientData);
      form.reset(); // Clear form after adding new patient
    }
    onFormSubmitSuccess?.();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          // Assuming the uploaded file is a JSON with patient data
          const uploadedData = JSON.parse(content);
          // Map uploaded data to form fields
          form.reset({
            name: uploadedData.name || '',
            dateOfBirth: uploadedData.dateOfBirth || '',
            medicalHistory: uploadedData.medicalHistory?.join(', ') || '',
            medications: uploadedData.medications?.join(', ') || '',
            allergies: uploadedData.allergies?.join(', ') || '',
            surgicalHistory: uploadedData.surgicalHistory?.join(', ') || '',
            mallampatiScore: uploadedData.mallampatiScore,
            airwayExamFindings: uploadedData.airwayExamFindings || '',
            clinicianNotes: uploadedData.clinicianNotes || '',
          });
          toast.success("Patient data loaded from file.");
        } catch (error) {
          console.error("Error parsing uploaded file:", error);
          toast.error("Failed to parse file. Please ensure it's valid JSON.");
        }
      };
      reader.readAsText(file);
    }
  };

  const simulateTruformData = async () => {
    const id = prompt('Please enter the TruForm ID:');
    if (id) {
      try {
        const truformPatient = await fetchTruformPatient(id);
        form.reset({
          name: truformPatient.name,
          dateOfBirth: truformPatient.dateOfBirth,
          medicalHistory: truformPatient.medicalHistory.join(', '),
          medications: truformPatient.medications.join(', '),
          allergies: truformPatient.allergies.join(', '),
          surgicalHistory: truformPatient.surgicalHistory.join(', '),
          mallampatiScore: truformPatient.mallampatiScore,
          airwayExamFindings: truformPatient.airwayExamFindings,
          clinicianNotes: truformPatient.clinicianNotes,
        });
        toast.success("Truform data loaded into form.");
      } catch (error) {
        console.error("Error fetching TruForm data:", error);
        toast.error("Failed to fetch TruForm data.");
        // Fallback to mock data on error
        // form.reset({
        //   name: 'Jane Doe (Mock)',
        //   dateOfBirth: '1985-03-15',
        //   medicalHistory: 'Hypertension, Type 2 Diabetes, Asthma',
        //   medications: 'Lisinopril 10mg, Metformin 500mg, Albuterol inhaler',
        //   allergies: 'Penicillin',
        //   surgicalHistory: 'Appendectomy (2005), Tonsillectomy (1990)',
        //   mallampatiScore: 2,
        //   airwayExamFindings: 'Normal mouth opening, visible uvula',
        //   clinicianNotes: 'Patient presents for wisdom tooth extraction. Well-controlled chronic conditions.',
        // });
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Patient Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="medicalHistory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Medical History (comma-separated)</FormLabel>
              <FormControl>
                <Textarea placeholder="Hypertension, Diabetes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="medications"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Medications (comma-separated)</FormLabel>
              <FormControl>
                <Textarea placeholder="Lisinopril, Metformin" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="allergies"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Known Allergies (comma-separated)</FormLabel>
              <FormControl>
                <Textarea placeholder="Penicillin, Latex" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="surgicalHistory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Surgical History (comma-separated)</FormLabel>
              <FormControl>
                <Textarea placeholder="Appendectomy (2010)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="mallampatiScore"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mallampati Score (1-4)</FormLabel>
                <Select onValueChange={(value) => field.onChange(value === 'n/a' ? null : Number(value))} value={field.value === undefined || field.value === null ? 'n/a' : String(field.value)}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select score" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="n/a">N/A</SelectItem> {/* Changed value to "n/a" */}
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="airwayExamFindings"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Airway Exam Findings</FormLabel>
                <FormControl>
                  <Input placeholder="Short neck, limited mouth opening" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="clinicianNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Clinician Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Patient appears anxious, good general health." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center space-x-2">
          <Input type="file" accept=".json" onChange={handleFileUpload} className="flex-1" />
          <Button type="button" variant="outline" onClick={simulateTruformData}>
            Simulate Truform Ingestion
          </Button>
        </div>

        <Button type="submit" className="w-full">
          {patientToEdit ? 'Update Patient' : 'Add Patient'}
        </Button>
      </form>
    </Form>
  );
};

export default PatientForm;