// Timesheet entity — hours logged for a worker over a period, with the bill/pay
// rates that apply, feeding client invoicing and margin reporting.

export type TimesheetStatus = 'Draft' | 'Submitted' | 'Approved' | 'Invoiced';

export const TIMESHEET_STATUSES: TimesheetStatus[] = ['Draft', 'Submitted', 'Approved', 'Invoiced'];

export interface Timesheet {
  id: string;
  employeeId: string;
  employeeName: string; // snapshot at entry time
  clientId?: string;
  clientName?: string; // snapshot
  periodStart: string; // ISO date (yyyy-mm-dd)
  periodEnd: string; // ISO date
  hours: number;
  billRate: number; // per hour
  payRate: number; // per hour
  status: TimesheetStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimesheetFormData {
  employeeId: string;
  clientId?: string;
  periodStart: string;
  periodEnd: string;
  hours: number;
  billRate: number;
  payRate: number;
  status: TimesheetStatus;
  notes?: string;
}
