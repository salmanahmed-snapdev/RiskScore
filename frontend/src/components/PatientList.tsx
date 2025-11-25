import React, { useState, useMemo } from 'react';
import { usePatients } from '@/context/PatientContext';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, PlusCircle, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'; // Import sorting icons
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Patient } from '@/types/patient'; // Import Patient type for sorting

interface PatientListProps {
  onEditPatient: (patientId: string) => void;
  onAddPatient: () => void;
}

type SortColumn = keyof Patient | 'riskCategory'; // Allow sorting by riskCategory
type SortDirection = 'asc' | 'desc';

const PatientList: React.FC<PatientListProps> = ({ onEditPatient, onAddPatient }) => {
  const { patients, selectedPatientId, selectPatient, deletePatient } = usePatients();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn | null>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getRiskCategoryOrder = (category: string | undefined) => {
    switch (category) {
      case 'High': return 3;
      case 'Moderate': return 2;
      case 'Low': return 1;
      default: return 0; // For 'N/A' or undefined
    }
  };

  const sortedAndFilteredPatients = useMemo(() => {
    let currentPatients = [...patients];

    // Filter first
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      currentPatients = currentPatients.filter(
        (patient) =>
          patient.name.toLowerCase().includes(lowerCaseSearchTerm) ||
          patient.dateOfBirth.includes(lowerCaseSearchTerm)
      );
    }

    // Then sort
    if (sortColumn) {
      currentPatients.sort((a, b) => {
        let valA: any;
        let valB: any;

        if (sortColumn === 'riskCategory') {
          valA = getRiskCategoryOrder(a.riskCategory);
          valB = getRiskCategoryOrder(b.riskCategory);
        } else {
          valA = a[sortColumn];
          valB = b[sortColumn];
        }

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        // Fallback for other types or undefined values
        return 0;
      });
    }

    return currentPatients;
  }, [patients, searchTerm, sortColumn, sortDirection]);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete patient ${name}?`)) {
      deletePatient(id);
      toast.success(`Patient ${name} deleted.`);
    }
  };

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

  const renderSortIcon = (column: SortColumn) => {
    if (sortColumn === column) {
      return sortDirection === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
    }
    return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground opacity-50" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Patients</h2>
        <Button onClick={onAddPatient} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Patient
        </Button>
      </div>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search patients by name or DOB..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>
      {sortedAndFilteredPatients.length === 0 ? (
        <p className="text-muted-foreground">
          {searchTerm ? `No patients found matching "${searchTerm}".` : 'No patients added yet. Click "Add New Patient" to get started.'}
        </p>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('name')}
                    className="flex items-center justify-start px-0 hover:bg-transparent"
                  >
                    Name
                    {renderSortIcon('name')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('dateOfBirth')}
                    className="flex items-center justify-start px-0 hover:bg-transparent"
                  >
                    DOB
                    {renderSortIcon('dateOfBirth')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('riskCategory')}
                    className="flex items-center justify-start px-0 hover:bg-transparent"
                  >
                    Risk Category
                    {renderSortIcon('riskCategory')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredPatients.map((patient) => (
                <TableRow
                  key={patient.id}
                  onClick={() => selectPatient(patient.id)}
                  className={selectedPatientId === patient.id ? 'bg-accent/50 cursor-pointer' : 'cursor-pointer'}
                >
                  <TableCell className="font-medium">{patient.name}</TableCell>
                  <TableCell>{patient.dateOfBirth}</TableCell>
                  <TableCell>
                    <Badge variant={getRiskBadgeVariant(patient.riskCategory)}>
                      {patient.riskCategory || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent row selection
                        onEditPatient(patient.id);
                      }}
                      className="mr-1"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent row selection
                        handleDelete(patient.id, patient.name);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default PatientList;