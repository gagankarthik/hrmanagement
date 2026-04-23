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
  // Multi-assignment support
  clientAssignments?: EmployeeClientAssignment[];
  vendorAssignments?: EmployeeVendorAssignment[];
  // Legacy fields for backward compatibility
  client?: string;
  vendorName?: string;
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
  status: 'Active' | 'Terminated';
  revenueStatus: 'B' | 'NB'; // Billable / Non-Billable
  subcontractorStatus?: 'Active' | 'Inactive';
  // No expiryDate for Offshore employees
}

// Union type for all employees
export type Employee = W2Employee | ContractEmployee | Employee1099 | OffshoreEmployee;

// Employee type enum
export type EmployeeType = 'W2' | 'Contract' | '1099' | 'Offshore';

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

// Form field configuration
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'number' | 'select' | 'checkbox';
  required: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

// Work Authorization / Visa Types
export const WORK_AUTHORIZATION_OPTIONS = [
  { value: 'US Citizen', label: 'US Citizen' },
  { value: 'Green Card', label: 'Green Card' },
  { value: 'GC EAD', label: 'GC EAD' },
  { value: 'H1B', label: 'H1B' },
  { value: 'H1B Transfer', label: 'H1B Transfer' },
  { value: 'H4', label: 'H4' },
  { value: 'H4 EAD', label: 'H4 EAD' },
  { value: 'L1A', label: 'L1A' },
  { value: 'L1B', label: 'L1B' },
  { value: 'L2', label: 'L2' },
  { value: 'L2 EAD', label: 'L2 EAD' },
  { value: 'OPT', label: 'OPT' },
  { value: 'STEM OPT', label: 'STEM OPT' },
  { value: 'CPT', label: 'CPT' },
  { value: 'F1', label: 'F1' },
  { value: 'J1', label: 'J1' },
  { value: 'EAD', label: 'EAD' },
  { value: 'EAD - Pending I-485', label: 'EAD - Pending I-485' },
  { value: 'Asylum EAD', label: 'Asylum EAD' },
  { value: 'TN', label: 'TN Visa' },
  { value: 'E1', label: 'E1' },
  { value: 'E2', label: 'E2' },
  { value: 'E3', label: 'E3' },
  { value: 'O1', label: 'O1' },
  { value: 'B1/B2', label: 'B1/B2' },
  { value: 'Other', label: 'Other' },
];

// Field configurations for each employee type
export const W2_FIELDS: FormField[] = [
  { name: 'name', label: 'Name', type: 'text', required: false, placeholder: 'Full Name' },
  { name: 'position', label: 'Position', type: 'text', required: false, placeholder: 'Job Title' },
  { name: 'dob', label: 'Date of Birth', type: 'date', required: false },
  { name: 'hireDate', label: 'Hire Date', type: 'date', required: false },
  { name: 'rehireDate', label: 'Rehire Date', type: 'date', required: false },
  { name: 'dor', label: 'Date of Resignation', type: 'date', required: false },
  { name: 'address', label: 'Address', type: 'text', required: false, placeholder: 'Street Address' },
  { name: 'city', label: 'City', type: 'text', required: false, placeholder: 'City' },
  { name: 'state', label: 'State', type: 'text', required: false, placeholder: 'State' },
  { name: 'pincode', label: 'Pincode', type: 'text', required: false, placeholder: 'Pincode' },
  { name: 'contactNo', label: 'Contact Number', type: 'tel', required: false, placeholder: '+1 (555) 000-0000' },
  { name: 'personalEmail', label: 'Personal Email', type: 'email', required: false, placeholder: 'personal@email.com' },
  { name: 'officeEmail', label: 'Office Email', type: 'email', required: false, placeholder: 'work@company.com' },
  { name: 'workAuthorization', label: 'Work Authorization', type: 'select', required: false, options: WORK_AUTHORIZATION_OPTIONS },
  { name: 'expiryDate', label: 'Authorization Expiry', type: 'date', required: false },
  { name: 'clientId', label: 'Client', type: 'select', required: false, options: [] },
  { name: 'vendorId', label: 'Vendor', type: 'select', required: false, options: [] },
  { name: 'salaryType', label: 'Salary Type', type: 'select', required: false, options: [
    { value: 'Hourly', label: 'Hourly' },
    { value: 'Annual', label: 'Annual' },
  ]},
  { name: 'pay', label: 'Pay', type: 'number', required: false, placeholder: '0.00' },
  { name: 'medicalBenefit', label: 'Medical Benefit', type: 'checkbox', required: false },
  { name: 'benefit401k', label: '401k Benefit', type: 'checkbox', required: false },
  { name: 'revenueStatus', label: 'Revenue Status', type: 'select', required: false, options: [
    { value: 'B', label: 'Billable (B)' },
    { value: 'NB', label: 'Non-Billable (NB)' },
  ]},
  { name: 'status', label: 'Status', type: 'select', required: false, options: [
    { value: 'Active', label: 'Active' },
    { value: 'Terminated', label: 'Terminated' },
    { value: 'Long Leave', label: 'Long Leave' },
  ]},
];

export const CONTRACT_FIELDS: FormField[] = [
  { name: 'name', label: 'Name', type: 'text', required: false, placeholder: 'Full Name' },
  { name: 'position', label: 'Position', type: 'text', required: false, placeholder: 'Job Title' },
  { name: 'dob', label: 'Date of Birth', type: 'date', required: false },
  { name: 'hireDate', label: 'Hire Date', type: 'date', required: false },
  { name: 'dor', label: 'Date of Release', type: 'date', required: false },
  { name: 'address', label: 'Address', type: 'text', required: false, placeholder: 'Street Address' },
  { name: 'city', label: 'City', type: 'text', required:false, placeholder: 'City' },
  { name: 'state', label: 'State', type: 'text', required: false, placeholder: 'State' },
  { name: 'pincode', label: 'Pincode', type: 'text', required: false, placeholder: 'Pincode' },
  { name: 'personalEmail', label: 'Personal Email', type: 'email', required: false, placeholder: 'personal@email.com' },
  { name: 'contactNo', label: 'Contact Number', type: 'tel', required: false, placeholder: '+1 (555) 000-0000' },
  { name: 'workAuthorization', label: 'Work Authorization', type: 'select', required: false, options: WORK_AUTHORIZATION_OPTIONS },
  { name: 'expiryDate', label: 'Authorization Expiry', type: 'date', required: false },
  { name: 'clientId', label: 'Client', type: 'select', required: false, options: [] },
  { name: 'vendorId', label: 'Vendor', type: 'select', required: false, options: [] },
  { name: 'contractorName', label: 'Contractor Name', type: 'text', required: false, placeholder: 'Contractor' },
  { name: 'revenueStatus', label: 'Revenue Status', type: 'select', required: false, options: [
    { value: 'B', label: 'Billable (B)' },
    { value: 'NB', label: 'Non-Billable (NB)' },
  ]},
  { name: 'subcontractorStatus', label: 'Subcontractor Status', type: 'select', required: false, options: [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
  ]},
  { name: 'status', label: 'Status', type: 'select', required: false, options: [
    { value: 'Active', label: 'Active' },
    { value: 'Terminated', label: 'Terminated' },
  ]},
];

export const EMPLOYEE_1099_FIELDS: FormField[] = [
  { name: 'name', label: 'Name', type: 'text', required: false, placeholder: 'Full Name' },
  { name: 'position', label: 'Position', type: 'text', required: false, placeholder: 'Job Title' },
  { name: 'dob', label: 'Date of Birth', type: 'date', required: false },
  { name: 'hireDate', label: 'Hire Date', type: 'date', required: false },
  { name: 'rehireDate', label: 'Rehire Date', type: 'date', required: false },
  { name: 'dor', label: 'Date of Release', type: 'date', required: false },
  { name: 'address', label: 'Address', type: 'text', required: false, placeholder: 'Street Address' },
  { name: 'city', label: 'City', type: 'text', required: false, placeholder: 'City' },
  { name: 'state', label: 'State', type: 'text', required: false, placeholder: 'State' },
  { name: 'pincode', label: 'Pincode', type: 'text', required: false, placeholder: 'Pincode' },
  { name: 'contactNo', label: 'Contact Number', type: 'tel', required: false, placeholder: '+1 (555) 000-0000' },
  { name: 'personalEmail', label: 'Personal Email', type: 'email', required: false, placeholder: 'personal@email.com' },
  { name: 'officeEmail', label: 'Office Email', type: 'email', required: false, placeholder: 'work@company.com' },
  { name: 'workAuthorization', label: 'Work Authorization', type: 'select', required: false, options: WORK_AUTHORIZATION_OPTIONS },
  { name: 'expiryDate', label: 'Authorization Expiry', type: 'date', required: false },
  { name: 'clientId', label: 'Client', type: 'select', required: false, options: [] },
  { name: 'vendorId', label: 'Vendor', type: 'select', required: false, options: [] },
  { name: 'salaryType', label: 'Salary Type', type: 'select', required: false, options: [
    { value: 'Hourly', label: 'Hourly' },
    { value: 'Annual', label: 'Annual' },
  ]},
  { name: 'pay', label: 'Pay', type: 'number', required: false, placeholder: '0.00' },
  { name: 'revenueStatus', label: 'Revenue Status', type: 'select', required: false, options: [
    { value: 'B', label: 'Billable (B)' },
    { value: 'NB', label: 'Non-Billable (NB)' },
  ]},
  { name: 'subcontractorStatus', label: 'Subcontractor Status', type: 'select', required: false, options: [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
  ]},
  { name: 'status', label: 'Status', type: 'select', required: false, options: [
    { value: 'Active', label: 'Active' },
    { value: 'Terminated', label: 'Terminated' },
  ]},
];

export const OFFSHORE_FIELDS: FormField[] = [
  { name: 'name', label: 'Name', type: 'text', required: false, placeholder: 'Full Name' },
  { name: 'position', label: 'Position', type: 'text', required: false, placeholder: 'Job Title' },
  { name: 'dob', label: 'Date of Birth', type: 'date', required: false },
  { name: 'hireDate', label: 'Hire Date', type: 'date', required: false },
  { name: 'dor', label: 'Date of Release', type: 'date', required: false },
  { name: 'address', label: 'Address', type: 'text', required: false, placeholder: 'Street Address' },
  { name: 'city', label: 'City', type: 'text', required: false, placeholder: 'City' },
  { name: 'state', label: 'State', type: 'text', required: false, placeholder: 'State' },
  { name: 'pincode', label: 'Pincode', type: 'text', required: false, placeholder: 'Pincode' },
  { name: 'vonageNo', label: 'Vonage Number', type: 'tel', required: false, placeholder: '+1 (555) 000-0000' },
  { name: 'contactNo', label: 'Contact Number', type: 'tel', required: false, placeholder: '+91 00000 00000' },
  { name: 'personalEmail', label: 'Personal Email', type: 'email', required: false, placeholder: 'personal@email.com' },
  { name: 'officeEmail', label: 'Office Email', type: 'email', required: false, placeholder: 'work@company.com' },
  { name: 'clientId', label: 'Client', type: 'select', required: false, options: [] },
  { name: 'vendorId', label: 'Vendor', type: 'select', required: false, options: [] },
  { name: 'aadharNumber', label: 'Aadhar Number', type: 'text', required: false, placeholder: 'XXXX-XXXX-XXXX' },
  { name: 'panNumber', label: 'PAN Number', type: 'text', required: false, placeholder: 'ABCDE1234F' },
  { name: 'pfNumber', label: 'PF Number', type: 'text', required: false, placeholder: 'PF Number (Optional)' },
  { name: 'salary', label: 'Salary (Monthly)', type: 'number', required: false, placeholder: '0.00' },
  { name: 'medicalReimbursement', label: 'Medical Reimbursement', type: 'number', required: false, placeholder: '0.00' },
  { name: 'payrollEntity', label: 'Payroll Entity', type: 'select', required: false, options: [
    { value: 'LLP', label: 'LLP' },
    { value: 'Pvt Ltd', label: 'Pvt Ltd' },
  ]},
  { name: 'employmentType', label: 'Employment Type', type: 'select', required: false, options: [
    { value: 'Contract', label: 'Contract' },
    { value: 'Full Time', label: 'Full Time' },
  ]},
  { name: 'revenueStatus', label: 'Revenue Status', type: 'select', required: false, options: [
    { value: 'B', label: 'Billable (B)' },
    { value: 'NB', label: 'Non-Billable (NB)' },
  ]},
  { name: 'subcontractorStatus', label: 'Subcontractor Status', type: 'select', required: false, options: [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' },
  ]},
  { name: 'status', label: 'Status', type: 'select', required: false, options: [
    { value: 'Active', label: 'Active' },
    { value: 'Terminated', label: 'Terminated' },
  ]},
];

// Helper to get fields by employee type
export function getFieldsByType(type: EmployeeType): FormField[] {
  switch (type) {
    case 'W2': return W2_FIELDS;
    case 'Contract': return CONTRACT_FIELDS;
    case '1099': return EMPLOYEE_1099_FIELDS;
    case 'Offshore': return OFFSHORE_FIELDS;
  }
}

// Column configurations for tables
export interface TableColumn {
  key: string;
  label: string;
  sortable: boolean;
  width?: string;
}

export const W2_COLUMNS: TableColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'position', label: 'Position', sortable: true },
  { key: 'hireDate', label: 'Hire Date', sortable: true },
  { key: 'state', label: 'State', sortable: true },
  { key: 'officeEmail', label: 'Email', sortable: false },
  { key: 'workAuthorization', label: 'Work Auth', sortable: true },
  { key: 'pay', label: 'Pay', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
];

export const CONTRACT_COLUMNS: TableColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'position', label: 'Position', sortable: true },
  { key: 'hireDate', label: 'Hire Date', sortable: true },
  { key: 'state', label: 'State', sortable: true },
  { key: 'personalEmail', label: 'Email', sortable: false },
  { key: 'workAuthorization', label: 'Work Auth', sortable: true },
  { key: 'contractorName', label: 'Contractor', sortable: true },
];

export const EMPLOYEE_1099_COLUMNS: TableColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'position', label: 'Position', sortable: true },
  { key: 'hireDate', label: 'Hire Date', sortable: true },
  { key: 'state', label: 'State', sortable: true },
  { key: 'personalEmail', label: 'Email', sortable: false },
  { key: 'workAuthorization', label: 'Work Auth', sortable: true },
  { key: 'pay', label: 'Pay', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
];

export const OFFSHORE_COLUMNS: TableColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'position', label: 'Position', sortable: true },
  { key: 'hireDate', label: 'Hire Date', sortable: true },
  { key: 'city', label: 'City', sortable: true },
  { key: 'officeEmail', label: 'Email', sortable: false },
  { key: 'salary', label: 'Salary', sortable: true },
  { key: 'employmentType', label: 'Type', sortable: true },
  { key: 'client', label: 'Client', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
];

export function getColumnsByType(type: EmployeeType): TableColumn[] {
  switch (type) {
    case 'W2': return W2_COLUMNS;
    case 'Contract': return CONTRACT_COLUMNS;
    case '1099': return EMPLOYEE_1099_COLUMNS;
    case 'Offshore': return OFFSHORE_COLUMNS;
  }
}
