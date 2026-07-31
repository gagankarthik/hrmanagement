import type { EmployeeType } from './employee.types';

/**
 * Employee form-field configuration — one canonical registry composed into the
 * four per-type field sets.
 *
 * Previously each type carried a full copy of every field (~80% identical),
 * so a label or option tweak had to be made four times and the copies drifted.
 * Now every field is defined once in FIELD_DEFS and each type declares only
 * its ordered field list plus its genuine deviations (e.g. W2 calls `dor`
 * "Date of Resignation" and allows the "Long Leave" status). The exported
 * arrays (W2_FIELDS, CONTRACT_FIELDS, EMPLOYEE_1099_FIELDS, OFFSHORE_FIELDS)
 * contain exactly the same data as before the restructure.
 */

// Form field configuration
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'number' | 'select' | 'checkbox';
  required: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  hint?: string; // short helper text shown beside the field label
}

/* ── Shared option lists ── */

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

const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Non-binary', label: 'Non-binary' },
  { value: 'Prefer not to say', label: 'Prefer not to say' },
];

const SALARY_TYPE_OPTIONS = [
  { value: 'Hourly', label: 'Hourly' },
  { value: 'Annual', label: 'Annual' },
];

const I9_STATUS_OPTIONS = [
  { value: 'Verified', label: 'Verified' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Re-verify', label: 'Re-verify' },
  { value: 'Exempt', label: 'Exempt' },
];

const AGREEMENT_STATUS_OPTIONS = [
  { value: 'Signed', label: 'Signed' },
  { value: 'Pending', label: 'Pending' },
  { value: 'N/A', label: 'N/A' },
];

const REVENUE_STATUS_OPTIONS = [
  { value: 'B', label: 'Billable (B)' },
  { value: 'NB', label: 'Non-Billable (NB)' },
];

const SUBCONTRACTOR_STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
];

const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Terminated', label: 'Terminated' },
];

// W2 additionally supports Long Leave (paired with the leave module).
const W2_STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Terminated', label: 'Terminated' },
  { value: 'Long Leave', label: 'Long Leave' },
];

const PAYROLL_ENTITY_OPTIONS = [
  { value: 'LLP', label: 'LLP' },
  { value: 'Pvt Ltd', label: 'Pvt Ltd' },
];

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: 'Contract', label: 'Contract' },
  { value: 'Full Time', label: 'Full Time' },
];

/* ── Canonical field registry — each field defined exactly once ── */

const FIELD_DEFS = {
  name: { name: 'name', label: 'Name', type: 'text', required: false, placeholder: 'Full Name' },
  position: { name: 'position', label: 'Position', type: 'text', required: false, placeholder: 'Job Title' },
  department: { name: 'department', label: 'Department', type: 'text', required: false, placeholder: 'e.g. Engineering' },
  reportingManager: { name: 'reportingManager', label: 'Reporting Manager', type: 'text', required: false, placeholder: 'Manager name' },
  billRate: { name: 'billRate', label: 'Bill Rate / hr', type: 'number', required: false, placeholder: '0.00', hint: 'What the client is billed per hour for this person.' },
  payRate: { name: 'payRate', label: 'Pay Rate / hr', type: 'number', required: false, placeholder: '0.00', hint: 'What the worker is paid per hour. Bill − Pay = your gross margin.' },
  gender: { name: 'gender', label: 'Gender', type: 'select', required: false, options: GENDER_OPTIONS },
  dob: { name: 'dob', label: 'Date of Birth', type: 'date', required: false },
  hireDate: { name: 'hireDate', label: 'Hire Date', type: 'date', required: false },
  rehireDate: { name: 'rehireDate', label: 'Rehire Date', type: 'date', required: false },
  dor: { name: 'dor', label: 'Date of Release', type: 'date', required: false },
  address: { name: 'address', label: 'Address', type: 'text', required: false, placeholder: 'Street Address' },
  city: { name: 'city', label: 'City', type: 'text', required: false, placeholder: 'City' },
  state: { name: 'state', label: 'State', type: 'text', required: false, placeholder: 'State' },
  pincode: { name: 'pincode', label: 'Pincode', type: 'text', required: false, placeholder: 'Pincode' },
  contactNo: { name: 'contactNo', label: 'Contact Number', type: 'tel', required: false, placeholder: '+1 (555) 000-0000' },
  personalEmail: { name: 'personalEmail', label: 'Personal Email', type: 'email', required: false, placeholder: 'personal@email.com' },
  officeEmail: { name: 'officeEmail', label: 'Office Email', type: 'email', required: false, placeholder: 'work@company.com' },
  vonageNo: { name: 'vonageNo', label: 'Vonage Number', type: 'tel', required: false, placeholder: '+1 (555) 000-0000' },
  workAuthorization: { name: 'workAuthorization', label: 'Work Authorization', type: 'select', required: false, options: WORK_AUTHORIZATION_OPTIONS },
  expiryDate: { name: 'expiryDate', label: 'Authorization Expiry', type: 'date', required: false },
  clientId: { name: 'clientId', label: 'Client', type: 'select', required: false, options: [] },
  vendorId: { name: 'vendorId', label: 'Vendor', type: 'select', required: false, options: [] },
  salaryType: { name: 'salaryType', label: 'Salary Type', type: 'select', required: false, options: SALARY_TYPE_OPTIONS },
  pay: { name: 'pay', label: 'Pay', type: 'number', required: false, placeholder: '0.00' },
  salary: { name: 'salary', label: 'Salary (Monthly)', type: 'number', required: false, placeholder: '0.00' },
  medicalBenefit: { name: 'medicalBenefit', label: 'Medical Benefit', type: 'checkbox', required: false },
  benefit401k: { name: 'benefit401k', label: '401k Benefit', type: 'checkbox', required: false },
  medicalReimbursement: { name: 'medicalReimbursement', label: 'Medical Reimbursement', type: 'number', required: false, placeholder: '0.00' },
  payrollEntity: { name: 'payrollEntity', label: 'Payroll Entity', type: 'select', required: false, options: PAYROLL_ENTITY_OPTIONS },
  employmentType: { name: 'employmentType', label: 'Employment Type', type: 'select', required: false, options: EMPLOYMENT_TYPE_OPTIONS },
  contractorName: { name: 'contractorName', label: 'Contractor Name', type: 'text', required: false, placeholder: 'Contractor' },
  aadharNumber: { name: 'aadharNumber', label: 'Aadhar Number', type: 'text', required: false, placeholder: 'XXXX-XXXX-XXXX' },
  panNumber: { name: 'panNumber', label: 'PAN Number', type: 'text', required: false, placeholder: 'ABCDE1234F' },
  pfNumber: { name: 'pfNumber', label: 'PF Number', type: 'text', required: false, placeholder: 'PF Number (Optional)' },
  uanNumber: { name: 'uanNumber', label: 'UAN No.', type: 'text', required: false, placeholder: 'Universal Account Number' },
  workCountry: { name: 'workCountry', label: 'Work Country', type: 'text', required: false, placeholder: 'e.g. United States, India' },
  i9Status: { name: 'i9Status', label: 'I-9 / Work Eligibility', type: 'select', required: false, options: I9_STATUS_OPTIONS },
  agreementStatus: { name: 'agreementStatus', label: 'Contractor Agreement', type: 'select', required: false, options: AGREEMENT_STATUS_OPTIONS },
  revenueStatus: { name: 'revenueStatus', label: 'Revenue Status', type: 'select', required: false, options: REVENUE_STATUS_OPTIONS },
  subcontractorStatus: { name: 'subcontractorStatus', label: 'Subcontractor Status', type: 'select', required: false, options: SUBCONTRACTOR_STATUS_OPTIONS },
  status: { name: 'status', label: 'Status', type: 'select', required: false, options: STATUS_OPTIONS },
} satisfies Record<string, FormField>;

type FieldName = keyof typeof FIELD_DEFS;

/** Compose a field from the registry, with optional per-type deviations. */
function f(name: FieldName, overrides?: Partial<FormField>): FormField {
  return overrides ? { ...FIELD_DEFS[name], ...overrides } : FIELD_DEFS[name];
}

/* ── Per-type field sets — ordered lists plus genuine deviations only ── */

export const W2_FIELDS: FormField[] = [
  f('name'), f('position'), f('department'), f('reportingManager'),
  f('billRate'), f('payRate'), f('gender'), f('dob'),
  f('hireDate'), f('rehireDate'), f('dor', { label: 'Date of Resignation' }),
  f('address'), f('city'), f('state'), f('pincode'),
  f('contactNo'), f('personalEmail'), f('officeEmail'),
  f('workAuthorization'), f('expiryDate'), f('clientId'), f('vendorId'),
  f('salaryType'), f('pay'), f('medicalBenefit'), f('benefit401k'),
  f('workCountry'), f('i9Status'), f('agreementStatus'), f('revenueStatus'),
  f('status', { options: W2_STATUS_OPTIONS }),
];

export const CONTRACT_FIELDS: FormField[] = [
  f('name'), f('position'), f('department'), f('reportingManager'),
  f('billRate'), f('payRate'), f('gender'), f('dob'),
  f('hireDate'), f('dor'),
  f('address'), f('city'), f('state'), f('pincode'),
  f('personalEmail'), f('contactNo'),
  f('workAuthorization'), f('expiryDate'), f('clientId'), f('vendorId'),
  f('contractorName'),
  f('workCountry'), f('i9Status'), f('agreementStatus'), f('revenueStatus'),
  f('subcontractorStatus'), f('status'),
];

export const EMPLOYEE_1099_FIELDS: FormField[] = [
  f('name'), f('position'), f('department'), f('reportingManager'),
  f('billRate'), f('payRate'), f('gender'), f('dob'),
  f('hireDate'), f('rehireDate'), f('dor'),
  f('address'), f('city'), f('state'), f('pincode'),
  f('contactNo'), f('personalEmail'), f('officeEmail'),
  f('workAuthorization'), f('expiryDate'), f('clientId'), f('vendorId'),
  f('salaryType'), f('pay'),
  f('workCountry'), f('i9Status'), f('agreementStatus'), f('revenueStatus'),
  f('subcontractorStatus'), f('status'),
];

export const OFFSHORE_FIELDS: FormField[] = [
  f('name'), f('position'), f('department'), f('reportingManager'),
  f('billRate'), f('payRate'), f('gender'), f('dob'),
  f('hireDate'), f('dor'),
  f('address'), f('city'), f('state'), f('pincode'),
  f('vonageNo'), f('contactNo', { placeholder: '+91 00000 00000' }),
  f('personalEmail'), f('officeEmail'), f('clientId'), f('vendorId'),
  f('aadharNumber'), f('panNumber'), f('pfNumber'), f('uanNumber'),
  f('salary'), f('medicalReimbursement'), f('payrollEntity'), f('employmentType'),
  f('workCountry'), f('i9Status'), f('agreementStatus'), f('revenueStatus'),
  f('subcontractorStatus'), f('status'),
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
