// Shared filter constants, badge maps and date helpers for the Leave Management
// page. Extracted verbatim from the original page.tsx so the page and its
// Balances/Calendar panels share one source of truth.

import type { ElementType } from 'react';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Leave, LeaveStatus, LeaveType } from '@/types/leave';

export const STATUS_FILTERS: ('all' | LeaveStatus)[] = ['all', 'Pending', 'Approved', 'Rejected'];
export const TYPE_FILTERS: ('all' | LeaveType)[] = ['all', 'Sick', 'Casual', 'PTO', 'Long Leave', 'Unpaid'];

export const statusBadge: Record<LeaveStatus, { cls: string; icon: ElementType }> = {
  Pending: { cls: 'bg-amber-50 text-amber-700 ring-amber-200', icon: Clock },
  Approved: { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', icon: CheckCircle2 },
  Rejected: { cls: 'bg-red-50 text-red-600 ring-red-200', icon: XCircle },
};

export const typeBadge: Record<LeaveType, string> = {
  Sick: 'bg-rose-50 text-rose-600',
  Casual: 'bg-sky-50 text-sky-600',
  PTO: 'bg-violet-50 text-violet-600',
  'Long Leave': 'bg-amber-50 text-amber-700',
  Unpaid: 'bg-slate-100 text-slate-600',
};

export function formatDate(value?: string) {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Date helpers for the calendar (work in local time, day-granular) ──────────
export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
export function parseDay(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return startOfDay(d);
}
/** True if [startDate,endDate] of the leave overlaps the given calendar day. */
export function leaveCoversDay(leave: Leave, day: Date): boolean {
  const start = parseDay(leave.startDate);
  const end = parseDay(leave.endDate) ?? start;
  if (!start) return false;
  const t = startOfDay(day).getTime();
  return t >= start.getTime() && t <= (end ?? start).getTime();
}
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}
