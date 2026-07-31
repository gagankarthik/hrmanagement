/** Shared number/currency/date formatters — the single source of truth so the
 *  same value never renders two ways across screens. */

/** Compact USD: 1.2K, 4.5M, $920. */
export function compactUsd(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${n < 0 ? '-' : ''}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${n < 0 ? '-' : ''}$${(abs / 1_000).toFixed(1)}K`;
  return `${n < 0 ? '-' : ''}$${Math.round(abs)}`;
}

/** Full USD with no decimals: $128,450. */
export function fullUsd(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

/**
 * Canonical money formatter — use this everywhere instead of ad-hoc
 * `toLocaleString(..currency..)`. Defaults to whole dollars ($1,200); pass
 * `cents: true` for two-decimal precision ($1,200.00). Non-finite/undefined
 * values render as an em-value-safe dash so tables never show "NaN".
 */
export function money(n: number | null | undefined, opts: { cents?: boolean } = {}): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: opts.cents ? 2 : 0,
    maximumFractionDigits: opts.cents ? 2 : 0,
  });
}

/** Whole-number percent with one decimal only when needed. */
export function pct(n: number): string {
  return `${Number.isInteger(n) ? n : n.toFixed(1)}%`;
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Parse a date value as LOCAL time. A bare `YYYY-MM-DD` string parses via the
 * Date constructor as UTC midnight, so users west of UTC see the previous day —
 * a real off-by-one on hire/DOB/work-auth-expiry fields. This forces date-only
 * strings to local midnight. Returns null for empty/invalid input.
 */
function parseLocal(value: string | number | Date | null | undefined): Date | null {
  if (value == null || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'string') {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Canonical date formatter — "Mar 5, 2026" by default. Date-only strings are
 * parsed as local time (no UTC off-by-one). Empty/invalid → the given fallback
 * (default "—"). Pass `long: true` for "March 5, 2026".
 */
export function formatDate(
  value: string | number | Date | null | undefined,
  opts: { long?: boolean; fallback?: string } = {},
): string {
  const d = parseLocal(value);
  if (!d) return opts.fallback ?? '—';
  const month = opts.long
    ? d.toLocaleDateString('en-US', { month: 'long' })
    : MONTHS_SHORT[d.getMonth()];
  return `${month} ${d.getDate()}, ${d.getFullYear()}`;
}

/** Date + time, e.g. "Mar 5, 2026 · 2:30 PM". Empty/invalid → fallback. */
export function formatDateTime(
  value: string | number | Date | null | undefined,
  opts: { fallback?: string } = {},
): string {
  const d = parseLocal(value);
  if (!d) return opts.fallback ?? '—';
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${formatDate(d)} · ${time}`;
}

/** Up to two initials from a person's name ("Gagan Karthik" → "GK", "" → "?"). */
export function initials(name?: string | null): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return (first + last).toUpperCase() || '?';
}
