import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * ZenHR brand mark — a self-contained SVG logo (rounded tile + "Z" monogram).
 * Replaces the previous generic lucide icon. Scales crisply from favicon to hero size.
 */
export function BrandMark({
  size = 36,
  variant = 'dark',
  className,
}: {
  size?: number;
  /** 'dark' = dark-green tile for light backgrounds; 'light' = white tile for dark backgrounds */
  variant?: 'dark' | 'light';
  className?: string;
}) {
  const tile = variant === 'light' ? '#ffffff' : '#03363D';
  const glyph = variant === 'light' ? '#03363D' : '#ffffff';
  const sheen = variant === 'light' ? '#03363D' : '#ffffff';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="ZenHR"
      className={cn('shrink-0', className)}
    >
      {/* Tile */}
      <rect width="40" height="40" rx="11" fill={tile} />
      {/* Subtle top sheen for depth */}
      <path d="M11 0h18a11 11 0 0 1 11 11v2H0v-2A11 11 0 0 1 11 0Z" fill={sheen} fillOpacity="0.07" />
      {/* "Z" monogram */}
      <path
        d="M13 13.75h14L13 26.25h14"
        stroke={glyph}
        strokeWidth="3.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* accent node — a nod to people/connection */}
      <circle cx="27" cy="13.75" r="2.4" fill="#79BBA9" />
    </svg>
  );
}
