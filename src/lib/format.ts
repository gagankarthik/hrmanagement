/** Shared number/currency formatters for dashboard widgets. */

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

/** Whole-number percent with one decimal only when needed. */
export function pct(n: number): string {
  return `${Number.isInteger(n) ? n : n.toFixed(1)}%`;
}
