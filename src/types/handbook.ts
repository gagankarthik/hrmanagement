import { EmployeeType } from './employee';
import { UploadedDoc } from './uploads';

// One accrual tier of the leave framework (accrual scales with length of service).
export interface LeaveAccrualTier {
  label?: string;        // e.g. "0–5 years"
  minYears: number;      // service-years lower bound (inclusive)
  maxYears?: number;     // upper bound (omit = "and above")
  monthlyHours?: number; // monthly accrual in hours
  annualDays?: number;   // annual equivalent in days
}

// Per-employee-category leave policy — a structured "Company Leave Policy Framework".
// `annualLeaveAllowance` (days) stays the canonical balance figure consumed by the
// Leaves balances tab and employee profile; all the richer fields are optional metadata.
export interface CategoryPolicy {
  employeeType: EmployeeType; // 'W2' | 'Contract' | '1099' | 'Offshore'
  definition?: string;        // category definition / eligibility note
  eligible?: boolean;         // eligible for paid annual leave (default true)
  proRata?: boolean;          // pro-rata entitlement (e.g. part-time)
  annualLeaveAllowance: number; // canonical total annual leave DAYS for this category
  entitlementWeeks?: number;  // standard weeks of entitlement (e.g. 4, shift = 5)
  accrualTiers?: LeaveAccrualTier[]; // accrual schedule by length of service
  noticeStandardWeeks?: number;      // notice required for standard requests (e.g. 4)
  noticeExtendedWeeks?: number;      // notice required for extended leave (e.g. 8)
  carryOverCapDays?: number;  // max days carried over (e.g. 2× annual)
  cashOutMaxDays?: number;    // max days cashed out per 12 months (e.g. 10)
  minUsageDays?: number;      // minimum days to be used per anniversary year
  publicHolidayNotDeducted?: boolean; // public holidays within leave not deducted
  documentationRequired?: string;     // required documents / process notes
  rules?: string;             // free-text policy / rules
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

// Suggested categories for Handbook forms (hiring, termination, leave, etc.).
export const HANDBOOK_FORM_CATEGORIES = [
  'Hiring',
  'Onboarding',
  'Termination',
  'Leave',
  'Payroll',
  'Benefits',
  'General',
] as const;

export type HandbookFormCategory = (typeof HANDBOOK_FORM_CATEGORIES)[number];

// Company form / document repository entry (hiring, termination, leave requests, etc.).
export interface HandbookForm {
  id: string;
  title: string;
  category?: string; // one of HANDBOOK_FORM_CATEGORIES
  description?: string;
  documents?: UploadedDoc[];
  createdAt: string;
  updatedAt: string;
}

export interface HandbookFormData {
  title: string;
  category?: string;
  description?: string;
  documents?: UploadedDoc[];
}
