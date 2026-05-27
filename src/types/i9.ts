// Digital Form I-9 + E-Verify tracking record (one per employee).
import { UploadedDoc } from './uploads';

export type EverifyStatus =
  | 'Not submitted'
  | 'Submitted'
  | 'Employment Authorized'
  | 'Tentative Nonconfirmation'
  | 'Final Nonconfirmation'
  | 'Closed';

export const EVERIFY_STATUSES: EverifyStatus[] = [
  'Not submitted', 'Submitted', 'Employment Authorized',
  'Tentative Nonconfirmation', 'Final Nonconfirmation', 'Closed',
];

export type CitizenshipStatus =
  | 'U.S. Citizen'
  | 'Noncitizen National'
  | 'Lawful Permanent Resident'
  | 'Alien Authorized to Work';

export const CITIZENSHIP_STATUSES: CitizenshipStatus[] = [
  'U.S. Citizen', 'Noncitizen National', 'Lawful Permanent Resident', 'Alien Authorized to Work',
];

export type I9Status =
  | 'Not started'
  | 'Section 1 complete'
  | 'Pending verification'
  | 'Verified'
  | 'E-Verified';

export interface I9AuditEvent {
  at: string;
  action: string;
  by?: string;
}

/** One work-authorization on a worker's record (current or historical). */
export interface WorkAuthEntry {
  id: string;
  type: string; // visa / authorization type (e.g. H1B, STEM OPT, Green Card)
  number?: string;
  issued?: string;
  expiry?: string;
  status?: 'Current' | 'Expired' | 'Superseded';
  note?: string;
}

export interface I9Record {
  employeeId: string;
  employeeName: string;

  // Section 1 — employee
  citizenshipStatus?: CitizenshipStatus;
  alienNumber?: string; // A-Number / USCIS number
  section1Date?: string;

  // Section 2 — document verification (employer or authorized rep)
  documentTitle?: string;
  issuingAuthority?: string;
  documentNumber?: string;
  documentExpiry?: string;
  section2Date?: string;

  // Authorized representative (remote hires)
  repName?: string;
  repEmail?: string;
  repTitle?: string;
  repAssignedDate?: string;

  // E-Verify tracker (status only — not a live DHS submission)
  everifyStatus: EverifyStatus;
  everifyCaseNumber?: string;
  everifyDate?: string;
  everifyNotes?: string;

  documents: UploadedDoc[];
  workAuthHistory?: WorkAuthEntry[];
  status: I9Status;
  notes?: string;
  auditTrail: I9AuditEvent[];
  createdAt: string;
  updatedAt: string;
}

/** Derive the overall I-9 status from the record's milestones. */
export function deriveI9Status(r: Partial<I9Record>): I9Status {
  if (r.everifyStatus === 'Employment Authorized') return 'E-Verified';
  if (r.section2Date) return 'Verified';
  if (r.repAssignedDate || r.documentTitle) return 'Pending verification';
  if (r.section1Date || r.citizenshipStatus) return 'Section 1 complete';
  return 'Not started';
}

/**
 * I-9 retention rule: keep until the LATER of 3 years after hire date or
 * 1 year after termination. Returns null if no hire date is known.
 */
export function i9RetentionDate(hireDate?: string, dor?: string): Date | null {
  if (!hireDate) return null;
  const hire = new Date(hireDate);
  if (Number.isNaN(hire.getTime())) return null;
  const threeAfterHire = new Date(hire);
  threeAfterHire.setFullYear(hire.getFullYear() + 3);
  if (dor) {
    const term = new Date(dor);
    if (!Number.isNaN(term.getTime())) {
      const oneAfterTerm = new Date(term);
      oneAfterTerm.setFullYear(term.getFullYear() + 1);
      return oneAfterTerm > threeAfterHire ? oneAfterTerm : threeAfterHire;
    }
  }
  return threeAfterHire;
}
