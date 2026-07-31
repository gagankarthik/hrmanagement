'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/** A titled card section used for grouped detail / form blocks. */
export function SectionCard({
  icon: Icon,
  title,
  description,
  actions,
  children,
  className,
}: {
  icon?: React.ElementType;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('surface p-5', className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-[var(--adm-surface-2)] text-[var(--adm-ink-subtle)]">
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </span>
          )}
          <div className="min-w-0">
            <h3 className="text-[14px] font-semibold text-[var(--adm-ink)]">{title}</h3>
            {description && <p className="text-[12.5px] text-[var(--adm-ink-mute)]">{description}</p>}
          </div>
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

/** A label/value pair for read-only detail grids. */
export function DetailField({
  label,
  value,
  className,
}: {
  label: string;
  value?: React.ReactNode;
  className?: string;
}) {
  const empty = value === undefined || value === null || value === '';
  return (
    <div className={cn('min-w-0', className)}>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--adm-ink-subtle)]">{label}</dt>
      <dd className={cn('mt-0.5 text-sm', empty ? 'text-slate-300' : 'font-medium text-[var(--adm-ink)]')}>
        {empty ? '—' : value}
      </dd>
    </div>
  );
}

/** Responsive grid wrapper for DetailField items. */
export function DetailGrid({ children, cols = 3 }: { children: React.ReactNode; cols?: 2 | 3 | 4 }) {
  return (
    <dl
      className={cn(
        'grid gap-x-6 gap-y-4',
        cols === 2 ? 'grid-cols-1 sm:grid-cols-2' : cols === 4 ? 'grid-cols-2 lg:grid-cols-4' : 'grid-cols-2 lg:grid-cols-3',
      )}
    >
      {children}
    </dl>
  );
}
