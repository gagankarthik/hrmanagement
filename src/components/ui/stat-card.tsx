import * as React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sparkline } from './sparkline';

export type StatTone = 'brand' | 'emerald' | 'red' | 'amber' | 'purple' | 'sky' | 'teal' | 'pink' | 'slate';

const toneStyles: Record<StatTone, { iconBg: string; iconColor: string; sparkStroke: string; sparkFill: string }> = {
  brand: { iconBg: 'bg-brand-100', iconColor: 'text-brand-600', sparkStroke: 'stroke-brand-500', sparkFill: 'fill-brand-200' },
  emerald: { iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', sparkStroke: 'stroke-emerald-500', sparkFill: 'fill-emerald-200' },
  red: { iconBg: 'bg-red-100', iconColor: 'text-red-600', sparkStroke: 'stroke-red-500', sparkFill: 'fill-red-200' },
  amber: { iconBg: 'bg-amber-100', iconColor: 'text-amber-600', sparkStroke: 'stroke-amber-500', sparkFill: 'fill-amber-200' },
  purple: { iconBg: 'bg-purple-100', iconColor: 'text-purple-600', sparkStroke: 'stroke-purple-500', sparkFill: 'fill-purple-200' },
  sky: { iconBg: 'bg-sky-100', iconColor: 'text-sky-600', sparkStroke: 'stroke-sky-500', sparkFill: 'fill-sky-200' },
  teal: { iconBg: 'bg-teal-100', iconColor: 'text-teal-600', sparkStroke: 'stroke-teal-500', sparkFill: 'fill-teal-200' },
  pink: { iconBg: 'bg-pink-100', iconColor: 'text-pink-600', sparkStroke: 'stroke-pink-500', sparkFill: 'fill-pink-200' },
  slate: { iconBg: 'bg-slate-100', iconColor: 'text-slate-600', sparkStroke: 'stroke-slate-400', sparkFill: 'fill-slate-200' },
};

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: React.ElementType;
  tone?: StatTone;
  hint?: React.ReactNode;
  /** Optional trend pill, e.g. { value: '12%', up: true } */
  trend?: { value: string; up?: boolean };
  /** Optional sparkline series shown bottom-right */
  spark?: number[];
  onClick?: () => void;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'slate',
  hint,
  trend,
  spark,
  onClick,
  className,
}: StatCardProps) {
  const t = toneStyles[tone];
  const interactive = Boolean(onClick);

  const content = (
    <>
      <div className="flex items-center justify-between">
        <div className={cn('flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset ring-black/[0.04]', t.iconBg)}>
          <Icon className={cn('h-5 w-5', t.iconColor)} />
        </div>
        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold',
              trend.up ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
            )}
          >
            {trend.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {trend.value}
          </span>
        )}
      </div>

      <p className="mt-3 font-display text-[1.65rem] font-bold leading-none text-slate-900">{value}</p>

      <div className="mt-1.5 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-500">{label}</p>
          {hint && <p className="mt-0.5 truncate text-[11px] text-slate-400">{hint}</p>}
        </div>
        {spark && spark.length > 1 && (
          <Sparkline
            data={spark}
            width={72}
            height={26}
            strokeClassName={t.sparkStroke}
            fillClassName={t.sparkFill}
            className="flex-shrink-0 self-end"
          />
        )}
      </div>
    </>
  );

  const base = 'surface p-4 animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-fill-mode:both]';

  if (interactive) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          base,
          'surface-hover block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200',
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
