import { EmployeeType } from '@/types/employee';
import { UploadedDoc } from '@/types/uploads';

// The category of a benefit plan
export type BenefitType =
  | 'Medical'
  | 'Dental'
  | 'Vision'
  | '401k'
  | 'Life'
  | 'Disability'
  | 'Other';

// Benefit plan entity interface
export interface BenefitPlan {
  id: string;
  name: string;
  type: BenefitType;
  provider?: string;
  eligibility: EmployeeType[];
  costPerMonth?: number;
  employerContribution?: number;
  description?: string;
  documents?: UploadedDoc[];
  enrolledEmployeeIds?: string[]; // employees enrolled in this plan
  status: 'Active' | 'Inactive';
  createdAt: string;
  updatedAt: string;
}

// Benefit plan form data (for creation/editing)
export interface BenefitFormData {
  name: string;
  type: BenefitType;
  provider?: string;
  eligibility: EmployeeType[];
  costPerMonth?: number;
  employerContribution?: number;
  description?: string;
  documents?: UploadedDoc[];
  enrolledEmployeeIds?: string[]; // employees enrolled in this plan
  status: 'Active' | 'Inactive';
}
