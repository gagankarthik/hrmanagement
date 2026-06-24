import * as React from 'react';
import { cn } from '@/lib/utils';
import { BRAND } from '@/config/brand';

/**
 * Brand mark — a self-contained SVG logo: a rounded forest tile holding three
 * ascending rounded pillars ("a workforce, in formation"), the tallest in the
 * amber accent. Deliberately abstract (no letterform) so the product can be
 * renamed without redrawing the mark. Scales crisply from favicon to hero.
 */
export function BrandMark({
  size = 36,
  variant = 'dark',
  className,
}: {
  size?: number;
  /** 'dark' = forest tile for light backgrounds; 'light' = white tile for dark backgrounds */
  variant?: 'dark' | 'light';
  className?: string;
}) {
  const tile = variant === 'light' ? '#ffffff' : '#1d4ed8';
  const bar = variant === 'light' ? '#1d4ed8' : '#dbe6fe';
  const accent = variant === 'light' ? '#2ad8ef' : '#5ce0f7'; // cyan — always pops
  const sheen = variant === 'light' ? '#1d4ed8' : '#ffffff';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={BRAND.name}
      className={cn('shrink-0', className)}
    >
      <rect width="40" height="40" rx="11" fill={tile} />
      {/* Subtle top sheen for depth */}
      <path d="M11 0h18a11 11 0 0 1 11 11v2H0v-2A11 11 0 0 1 11 0Z" fill={sheen} fillOpacity="0.07" />
      {/* Three ascending pillars on a shared baseline */}
      <g strokeLinecap="round" strokeWidth="4">
        <line x1="14" y1="28" x2="14" y2="23" stroke={bar} />
        <line x1="20" y1="28" x2="20" y2="18.5" stroke={bar} />
        <line x1="26" y1="28" x2="26" y2="12" stroke={accent} />
      </g>
    </svg>
  );
}
