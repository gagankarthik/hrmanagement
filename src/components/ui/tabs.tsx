'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem<T extends string> {
  value: T;
  label: string;
  icon?: React.ElementType;
  /** Optional count pill (e.g. row counts on list tabs). */
  count?: number;
  /** Optional status dot color (e.g. employee-type tabs). */
  dotColor?: string;
}

/**
 * The single tab bar for the app — an accessible underline tablist that replaces
 * the four ad-hoc variants (dot+pill, segmented, underline). Full keyboard
 * support: arrows move between tabs, Home/End jump to ends, roving tabIndex.
 */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel?: string;
  className?: string;
}) {
  const refs = React.useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = (e: React.KeyboardEvent, idx: number) => {
    let next = idx;
    if (e.key === 'ArrowRight') next = (idx + 1) % items.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + items.length) % items.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    else return;
    e.preventDefault();
    onChange(items[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('flex items-center gap-1 overflow-x-auto border-b border-slate-200', className)}
    >
      {items.map((t, i) => {
        const active = t.value === value;
        const Icon = t.icon;
        return (
          <button
            key={t.value}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'relative inline-flex items-center gap-2 whitespace-nowrap rounded-t-lg px-4 py-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200',
              active ? 'text-brand-700' : 'text-slate-500 hover:text-slate-800',
            )}
          >
            {t.dotColor && <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: t.dotColor }} />}
            {Icon && <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />}
            {t.label}
            {typeof t.count === 'number' && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums',
                  active ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500',
                )}
              >
                {t.count}
              </span>
            )}
            {active && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-t-full bg-brand-600" />}
          </button>
        );
      })}
    </div>
  );
}
