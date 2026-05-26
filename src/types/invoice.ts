// Invoice entity — a client bill generated from timesheet hours × bill rate.

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid';

export const INVOICE_STATUSES: InvoiceStatus[] = ['Draft', 'Sent', 'Paid'];

export interface InvoiceLineItem {
  timesheetId?: string;
  employeeId: string;
  description: string; // e.g. "Priya Nair · 2026-03-01 → 2026-03-07"
  hours: number;
  rate: number; // bill rate per hour
  amount: number; // hours × rate
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  periodStart: string;
  periodEnd: string;
  issueDate: string;
  dueDate?: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  total: number;
  status: InvoiceStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceFormData {
  clientId: string;
  clientName: string;
  periodStart: string;
  periodEnd: string;
  issueDate: string;
  dueDate?: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  total: number;
  status: InvoiceStatus;
  notes?: string;
}
