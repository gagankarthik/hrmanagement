// Per-employee Document Hub — collect & categorize all employee documents.
import { UploadedDoc } from './uploads';

export const DOC_CATEGORIES = [
  'Identity',
  'Work Authorization',
  'Offer/Contract',
  'Certification',
  'Tax',
  'Other',
] as const;

export type DocCategory = (typeof DOC_CATEGORIES)[number];

export interface EmployeeDocItem extends UploadedDoc {
  category?: DocCategory;
  note?: string;
}

export interface EmployeeDocsRecord {
  employeeId: string;
  employeeName: string;
  documents: EmployeeDocItem[];
  createdAt: string;
  updatedAt: string;
}
