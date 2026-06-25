// Shared constants, pure helpers and the common tab prop shape for the
// Workforce Reports page. Extracted verbatim from the original page.tsx so the
// individual tab/PDF modules can reuse them without duplication.

import { format } from 'date-fns';
import type { Employee, EmployeeType } from '@/types/employee';

export const HOURS_PER_MONTH = 173;

export const TYPE_COLOR: Record<EmployeeType, { hex: string; bg: string; text: string; ring: string }> = {
  W2:       { hex: '#3b82f6', bg: 'bg-blue-50',    text: 'text-blue-700',    ring: 'ring-blue-200' },
  Contract: { hex: '#a855f7', bg: 'bg-purple-50',  text: 'text-purple-700',  ring: 'ring-purple-200' },
  '1099':   { hex: '#14b8a6', bg: 'bg-teal-50',    text: 'text-teal-700',    ring: 'ring-teal-200' },
  Offshore: { hex: '#ec4899', bg: 'bg-pink-50',    text: 'text-pink-700',    ring: 'ring-pink-200' },
};

export const TYPE_LABEL: Record<EmployeeType, string> = {
  W2: 'W-2', Contract: 'Contract', '1099': '1099', Offshore: 'Offshore',
};

export interface TabProps {
  filtered: Employee[];
  clients?: { id: string; name: string }[];
  vendors?: { id: string; name: string }[];
}

// ─────────────────── Helpers ───────────────────
export function isActive(e: Employee): boolean {
  return 'status' in e ? (e as { status: string }).status === 'Active' : true;
}
export function monthlyPay(e: Employee): number {
  const pay = 'pay' in e ? (e as { pay?: number }).pay : undefined;
  const salaryType = 'salaryType' in e ? (e as { salaryType?: string }).salaryType : undefined;
  const salary = 'salary' in e ? (e as { salary?: number }).salary : undefined;
  if (typeof pay === 'number' && pay > 0) return salaryType === 'Hourly' ? pay * HOURS_PER_MONTH : pay / 12;
  if (typeof salary === 'number' && salary > 0) return salary;
  return 0;
}
export function compactCurrency(n: number): string {
  if (!isFinite(n) || n <= 0) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(n >= 100_000 ? 0 : 1)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}
export function fullCurrency(n: number): string {
  if (!isFinite(n) || n <= 0) return '$0';
  return `$${Math.round(n).toLocaleString()}`;
}
export function downloadCSV(rows: Record<string, unknown>[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const out = [headers.join(',')];
  for (const row of rows) {
    out.push(headers.map((h) => {
      const v = row[h];
      if (v == null) return '';
      const s = String(v);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
      return s;
    }).join(','));
  }
  const blob = new Blob([out.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
