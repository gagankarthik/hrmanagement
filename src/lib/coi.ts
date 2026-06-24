/**
 * Certificate of Insurance (COI) policy expiry helpers — shared by the
 * subcontractor detail page and the dashboard so the 60-day window is
 * computed identically everywhere.
 */

export type CoiState = 'none' | 'valid' | 'expiring' | 'expired';

export interface CoiStatus {
  state: CoiState;
  /** Whole days until expiry (negative if already expired). null when no date. */
  days: number | null;
  /** Human label, e.g. "Expires in 42 days", "Expired 5 days ago". */
  label: string;
  tone: 'emerald' | 'amber' | 'red' | 'slate';
}

/** Threshold (in days) for the "expiring soon" warning window. */
export const COI_WARN_DAYS = 60;

const MS_PER_DAY = 86_400_000;

export function coiStatus(expiryDate?: string, warnDays: number = COI_WARN_DAYS): CoiStatus {
  if (!expiryDate) {
    return { state: 'none', days: null, label: 'No COI on file', tone: 'slate' };
  }
  const exp = new Date(expiryDate);
  if (Number.isNaN(exp.getTime())) {
    return { state: 'none', days: null, label: 'No COI on file', tone: 'slate' };
  }
  // Compare at day granularity (ignore time-of-day).
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfExp = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate());
  const days = Math.round((startOfExp.getTime() - startOfToday.getTime()) / MS_PER_DAY);

  if (days < 0) {
    return {
      state: 'expired',
      days,
      label: `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`,
      tone: 'red',
    };
  }
  if (days <= warnDays) {
    return {
      state: 'expiring',
      days,
      label: days === 0 ? 'Expires today' : `Expires in ${days} day${days === 1 ? '' : 's'}`,
      tone: 'amber',
    };
  }
  return { state: 'valid', days, label: `Expires in ${days} days`, tone: 'emerald' };
}
