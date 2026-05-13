import * as React from 'react';
import { cn } from '@/lib/utils';

export type StatTone = 'indigo' | 'emerald' | 'red' | 'amber' | 'purple' | 'sky' | 'teal' | 'pink' | 'slate';

const toneStyles: Record<StatTone, { iconBg: string; iconColor: string }> = {
  indigo: { iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  emerald: { iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  red: { iconBg: 'bg-red-100', iconColor: 'text-red-600' },
  amber: { iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
  purple: { iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
  sky: { iconBg: 'bg-sky-100', iconColor: 'text-sky-600' },
  teal: { iconBg: 'bg-teal-100', iconColor: 'text-teal-600' },
  pink: { iconBg: 'bg-pink-100', iconColor: 'text-pink-600' },
  slate: { iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
};

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ElementType;
  tone?: StatTone;
  hint?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'slate',
  hint,
  onClick,
  className,
}: StatCardProps) {
  const t = toneStyles[tone];
  const interactive = Boolean(onClick);

  const content = (
    <>
      <div className={cn('flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl', t.iconBg)}>
        <Icon className={cn('h-5 w-5', t.iconColor)} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-slate-900 leading-tight">{value}</p>
        <p className="mt-0.5 truncate text-xs font-medium text-slate-500">{label}</p>
        {hint && <p className="mt-0.5 truncate text-[11px] text-slate-400">{hint}</p>}
      </div>
    </>
  );

  const base = 'flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm';

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          base,
          'text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200',
          className
        )}
      >
        {content}
      </button>
    );
  }

  return <div className={cn(base, className)}>{content}</div>;
}

type ColumnCount = 2 | 3 | 4 | 5 | 6;

const colsClass: Record<ColumnCount, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
  6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
};

export function StatGrid({
  children,
  cols = 4,
  className,
}: {
  children: React.ReactNode;
  cols?: ColumnCount;
  className?: string;
}) {
  return <div className={cn('grid gap-4', colsClass[cols], className)}>{children}</div>;
}
