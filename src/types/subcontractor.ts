// Subcontractor entity interface
export interface Subcontractor {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

// Subcontractor form data (for creation/editing)
export interface SubcontractorFormData {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: 'Active' | 'Inactive';
}

// Subcontractor with employee count (for dashboard display)
export interface SubcontractorWithCount extends Subcontractor {
  employeeCount: number;
}
