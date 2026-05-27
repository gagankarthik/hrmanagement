// Form I-983 (STEM OPT training plan) tracking record (one per employee).
// This tracks I-983 completion + the required STEM OPT evaluations — it does
// NOT submit anything to USCIS, SEVP, or the student's school.
import { UploadedDoc } from './uploads';

export type I983Status = 'Draft' | 'Active' | 'Completed';

export const I983_STATUSES: I983Status[] = ['Draft', 'Active', 'Completed'];

export interface I983MaterialChange {
  id: string;
  date?: string;
  description: string;
  reportedDate?: string;
}

/** A STEM OPT evaluation milestone (used for both the 12-month and 24-month evaluations). */
export interface I983Evaluation {
  dueDate?: string;
  completedDate?: string;
  done?: boolean;
}

export interface I983AuditEvent {
  at: string;
  action: string;
  by?: string;
}

export interface I983Record {
  employeeId: string;
  employeeName: string;

  // Student & school
  schoolName?: string;
  degreeLevel?: string;
  sevisId?: string;
  fieldOfStudy?: string;

  // Employer
  employerName?: string;
  employerEIN?: string;
  siteAddress?: string;

  // Training plan
  jobTitle?: string;
  jobDuties?: string;
  supervisorName?: string;
  supervisorEmail?: string;
  hoursPerWeek?: number;
  compensation?: string;
  goalsObjectives?: string; // learning goals & objectives for the training
  oversightMeasurement?: string; // how learning goals are measured/supervised
  trainingStartDate?: string;
  trainingEndDate?: string;

  // Evaluations (STEM OPT requires a 12-month self-eval and a 24-month final eval)
  eval12: I983Evaluation;
  eval24: I983Evaluation;

  materialChanges: I983MaterialChange[];
  documents: UploadedDoc[];

  status: I983Status;
  notes?: string;
  auditTrail: I983AuditEvent[];
  createdAt: string;
  updatedAt: string;
}

/** Derive the overall I-983 status from the record's milestones. */
export function deriveI983Status(r: Partial<I983Record>): I983Status {
  if (r.eval24?.done) return 'Completed';
  if (r.trainingStartDate) return 'Active';
  return 'Draft';
}

/** Add a number of months to an ISO date string, returning a new ISO date (YYYY-MM-DD). */
function addMonthsISO(iso: string, months: number): string | undefined {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

/**
 * The next evaluation that is due for a record, or null when both are done.
 * - If the 12-month eval is not done: due = eval12.dueDate OR (start + 12 months).
 * - If the 12-month eval is done but the 24-month is not: due = eval24.dueDate OR (start + 24 months).
 * - If both are done: null.
 * `days` is the number of days until the due date (negative = overdue).
 */
export function nextEvaluationDue(
  r: Partial<I983Record>
): { label: string; dueDate?: string; overdue: boolean; days: number } | null {
  const start = r.trainingStartDate;
  let label: string;
  let dueDate: string | undefined;

  if (!r.eval12?.done) {
    label = '12-month evaluation';
    dueDate = r.eval12?.dueDate || (start ? addMonthsISO(start, 12) : undefined);
  } else if (!r.eval24?.done) {
    label = '24-month evaluation';
    dueDate = r.eval24?.dueDate || (start ? addMonthsISO(start, 24) : undefined);
  } else {
    return null;
  }

  if (!dueDate) return { label, dueDate: undefined, overdue: false, days: 0 };

  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return { label, dueDate, overdue: false, days: 0 };

  const now = new Date();
  const days = Math.ceil((due.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  return { label, dueDate, overdue: days < 0, days };
}
