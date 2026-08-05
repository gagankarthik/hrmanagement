import * as React from 'react';
import { cn } from '@/lib/utils';
import { initials } from '@/lib/format';

const SIZES = {
  xs: 'h-6 w-6 text-[0.6667rem]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
  xl: 'h-16 w-16 text-lg',
} as const;

/**
 * The one avatar — a flat cobalt initials chip, identical on every page.
 * Always shows up to two initials (first + last name); "?" when unnamed.
 */
export function Avatar({
  name,
  size = 'sm',
  className,
}: {
  name?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 select-none items-center justify-center rounded-full bg-[var(--adm-accent-soft)] font-bold text-[var(--adm-accent)]',
        SIZES[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
