'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * The standard filter dropdown — a styled native <select> so single-select
 * filters read as one clean control instead of a row of pills. Native select
 * keeps full keyboard + screen-reader support and mobile-friendly pickers.
 * Give the "all" case a clear first option (e.g. "All statuses") so no extra
 * label is needed.
 */
export function FilterSelect<T extends string>({
  value,
  onChange,
  options,
  label,
  id,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  /** Accessible name (visually hidden). */
  label?: string;
  id?: string;
  className?: string;
}) {
  const reactId = React.useId();
  const selectId = id ?? reactId;
  return (
    <div className={cn('relative inline-flex', className)}>
      {label && (
        <label htmlFor={selectId} className="sr-only">
          {label}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        aria-label={label}
        className="h-8 w-full appearance-none rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] pl-2.5 pr-8 text-[0.8667rem] font-medium text-[var(--adm-ink-mute)] outline-none transition-colors hover:border-[var(--adm-line-strong)] hover:text-[var(--adm-ink)] focus:border-[var(--adm-accent)] focus:ring-2 focus:ring-[var(--adm-focus-ring)]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--adm-ink-subtle)]" strokeWidth={2} />
    </div>
  );
}
