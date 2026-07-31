/**
 * Employee domain model — the single source of truth for the four workforce
 * types (W2, Contract, 1099, Offshore) and their shared base shape.
 *
 * Moved verbatim from src/types/employee.ts as part of the feature-modular
 * migration (see ARCHITECTURE.md); that path re-exports this module so every
 * existing import keeps working.
 */

export interface EmployeeClientAssignment {
  clientId: string;
  startDate?: string;
  endDate?: string;
}

export interface EmployeeVendorAssignment {
  vendorId: string;
  startDate?: string;
  endDate?: string;
}

export interface EmployeeEndClientAssignment {
  clientId: string;
  startDate?: string;
  endDate?: string;
}

export interface EmployeeEndVendorAssignment {
  vendorId: string;
  startDate?: string;
  endDate?: string;
}

export interface EmployeeSubcontractorAssignment {
  subcontractorId: string;
  startDate?: string;
  endDate?: string;
}

// Base employee interface with common fields
export interface BaseEmployee {
  id: string;
  name: string;
  position: string;
  dob: string;
  hireDate: string;
  dor: string; // Date of Resignation/Release
  address: string;
  city: string;
  state: string;
  pincode: string;
  contactNo: string;
  personalEmail: string;
  // Primary client/vendor IDs (derived from active assignment)
  clientId?: string;
  vendorId?: string;
  endClientId?: string;
  endVendorId?: string;
  subcontractorId?: string;
  // Multi-assignment support
  clientAssignments?: EmployeeClientAssignment[];
  vendorAssignments?: EmployeeVendorAssignment[];
  endClientAssignments?: EmployeeEndClientAssignment[];
  endVendorAssignments?: EmployeeEndVendorAssignment[];
  subcontractorAssignments?: EmployeeSubcontractorAssignment[];
  // Legacy fields for backward compatibility
  client?: string;
  vendorName?: string;
  // Staffing economics (hourly) — drives Margins, Timesheets & Invoicing
  billRate?: number; // what the client is billed per hour
  payRate?: number; // what the worker is paid per hour
  // Compliance pack — work eligibility & agreements (US + international)
  workCountry?: string;
  i9Status?: string;
  agreementStatus?: string;
  // Workforce attributes
  gender?: string;
  department?: string;
  reportingManager?: string;
  createdAt: string;
  updatedAt: string;
}

// W2 Employee - Full-time employees
export interface W2Employee extends BaseEmployee {
  type: 'W2';
  rehireDate: string;
  officeEmail: string;
  workAuthorization: string;
  expiryDate: string; // Authorization expiry for W2
  salaryType: 'Hourly' | 'Annual';
  pay?: number;
  medicalBenefit: boolean;
  benefit401k: boolean;
  status: 'Active' | 'Terminated';
  revenueStatus: 'B' | 'NB'; // Billable / Non-Billable
  subcontractorStatus?: 'Active' | 'Inactive';
}

// Contract Employee
export interface ContractEmployee extends BaseEmployee {
  type: 'Contract';
  contractorName: string;
  workAuthorization: string;
  expiryDate: string; // Authorization expiry for Contract
  status: 'Active' | 'Terminated';
  revenueStatus: 'B' | 'NB'; // Billable / Non-Billable
  subcontractorStatus?: 'Active' | 'Inactive';
}

// 1099 Employee - Independent Contractors
export interface Employee1099 extends BaseEmployee {
  type: '1099';
  rehireDate: string;
  officeEmail: string;
  workAuthorization: string;
  expiryDate: string; // Authorization expiry for 1099
  salaryType: 'Hourly' | 'Annual';
  pay?: number;
  status: 'Active' | 'Terminated';
  revenueStatus: 'B' | 'NB'; // Billable / Non-Billable
  subcontractorStatus?: 'Active' | 'Inactive';
}

// Offshore Employee
export interface OffshoreEmployee extends BaseEmployee {
  type: 'Offshore';
  vonageNo: string;
  officeEmail: string;
  salary?: number;
  medicalReimbursement?: number;
  payrollEntity: 'LLP' | 'Pvt Ltd';
  employmentType: 'Contract' | 'Full Time';
  aadharNumber: string; // Aadhar Number - India unique identification number
  panNumber: string; // PAN Number - India tax ID
  pfNumber?: string; // PF Number - Provident Fund number (optional)
  uanNumber?: string; // UAN - Universal Account Number (India PF, optional)
  status: 'Active' | 'Terminated';
  revenueStatus: 'B' | 'NB'; // Billable / Non-Billable
  subcontractorStatus?: 'Active' | 'Inactive';
  // No expiryDate for Offshore employees
}

// Union type for all employees
export type Employee = W2Employee | ContractEmployee | Employee1099 | OffshoreEmployee;

// Employee type enum
export type EmployeeType = 'W2' | 'Contract' | '1099' | 'Offshore';

/** Canonical order + presentation metadata for the four workforce types. */
export const EMPLOYEE_TYPES: { value: EmployeeType; label: string; dotColor: string }[] = [
  { value: 'W2', label: 'W2', dotColor: '#1d4ed8' },
  { value: 'Contract', label: 'Contract', dotColor: '#8b5cf6' },
  { value: '1099', label: '1099', dotColor: '#0d9488' },
  { value: 'Offshore', label: 'Offshore', dotColor: '#ec4899' },
];

// Filter options
export interface EmployeeFilters {
  type: EmployeeType | 'All';
  status: 'Active' | 'Terminated' | 'All';
  state: string;
  searchQuery: string;
}

// Dashboard statistics
export interface DashboardStats {
  totalEmployees: number;
  w2Count: number;
  contractCount: number;
  employee1099Count: number;
  offshoreCount: number;
  activeCount: number;
  terminatedCount: number;
  expiringAuthorizations: number;
  // Revenue status counts
  billableCount: number;
  nonBillableCount: number;
  // Subcontractor counts
  activeSubcontractors: number;
  inactiveSubcontractors: number;
  // Client and Vendor counts
  uniqueClients: number;
  uniqueVendors: number;
  // Hiring trends by month
  hiringTrendByMonth: { month: string; count: number; w2: number; offshore: number }[];
}
