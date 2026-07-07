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
        className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm font-semibold text-slate-700 outline-none transition hover:bg-slate-50 focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-100"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={2} />
    </div>
  );
}
