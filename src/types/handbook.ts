import { EmployeeType } from './employee';
import { UploadedDoc } from './uploads';

// Per-employee-category policy: annual leave allowance + rules + policy documents.
export interface CategoryPolicy {
  employeeType: EmployeeType; // 'W2' | 'Contract' | '1099' | 'Offshore'
  annualLeaveAllowance: number; // total annual leave days for this category
  rules?: string; // free-text policy / rules
  documents?: UploadedDoc[];
  updatedAt?: string;
}

// Company SOP / handbook document entry.
export interface SopDoc {
  id: string;
  title: string;
  category?: string; // e.g. 'Onboarding', 'Conduct', 'Payroll', 'IT'
  description?: string;
  documents?: UploadedDoc[];
  createdAt: string;
  updatedAt: string;
}

export interface SopFormData {
  title: string;
  category?: string;
  description?: string;
  documents?: UploadedDoc[];
}
