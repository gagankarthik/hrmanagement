// Shared grouping for employee scalar fields — used by the onboarding wizard,
// the edit modal, and the profile view so they all present the same sections.
// Assignment editors (client / vendor / end-client / end-vendor / subcontractor)
// are rendered as their own dedicated section, not via this scalar map.

export type EmployeeFormSection = {
  id: string;
  title: string;
  description?: string;
  fields: string[];
};

export const EMPLOYEE_FORM_SECTIONS: EmployeeFormSection[] = [
  {
    id: 'personal',
    title: 'Personal',
    description: 'Identity and contact details',
    fields: ['name', 'position', 'gender', 'dob', 'personalEmail', 'contactNo', 'vonageNo'],
  },
  {
    id: 'address',
    title: 'Address',
    description: 'Mailing and residence',
    fields: ['address', 'city', 'state', 'pincode'],
  },
  {
    id: 'employment',
    title: 'Employment',
    description: 'Status, dates and compensation',
    fields: [
      'department', 'reportingManager', 'hireDate', 'rehireDate', 'dor', 'status', 'revenueStatus',
      'salaryType', 'pay', 'salary', 'billRate', 'payRate', 'employmentType', 'payrollEntity',
      'contractorName', 'subcontractorStatus', 'medicalBenefit',
      'benefit401k', 'medicalReimbursement',
    ],
  },
  {
    id: 'authorization',
    title: 'Work Authorization',
    description: 'Visa, expiry and work email',
    fields: ['workAuthorization', 'expiryDate', 'officeEmail'],
  },
  {
    id: 'identity',
    title: 'Identity & Payroll',
    description: 'Government IDs (Offshore)',
    fields: ['aadharNumber', 'panNumber', 'pfNumber', 'uanNumber'],
  },
];

const FIELD_TO_SECTION: Record<string, string> = EMPLOYEE_FORM_SECTIONS.reduce(
  (acc, s) => {
    s.fields.forEach((f) => { acc[f] = s.id; });
    return acc;
  },
  {} as Record<string, string>,
);

export function sectionForField(name: string): string {
  return FIELD_TO_SECTION[name] ?? 'other';
}
