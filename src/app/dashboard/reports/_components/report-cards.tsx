// Reusable presentational atoms shared across the report tabs: filter selects,
// summary stats, and the section/chart card shells. Moved verbatim from the
// original page.tsx.

import React from 'react';
import { cn } from '@/lib/utils';

export function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

const SUMMARY_TONE: Record<string, { iconBg: string; iconColor: string; value: string }> = {
  brand:  { iconBg: 'bg-brand-100',  iconColor: 'text-brand-600',  value: 'text-slate-900' },
  emerald: { iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', value: 'text-emerald-700' },
  purple:  { iconBg: 'bg-purple-100',  iconColor: 'text-purple-600',  value: 'text-slate-900' },
  amber:   { iconBg: 'bg-amber-100',   iconColor: 'text-amber-600',   value: 'text-amber-700' },
  red:     { iconBg: 'bg-red-100',     iconColor: 'text-red-600',     value: 'text-red-700' },
  sky:     { iconBg: 'bg-sky-100',     iconColor: 'text-sky-600',     value: 'text-slate-900' },
  slate:   { iconBg: 'bg-slate-100',   iconColor: 'text-slate-500',   value: 'text-slate-700' },
};

export function SummaryStat({ icon: Icon, label, value, sub, tone }: { icon: React.ElementType; label: string; value: string; sub?: string; tone: keyof typeof SUMMARY_TONE }) {
  const t = SUMMARY_TONE[tone];
  return (
    <div className="flex items-center gap-3">
      <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl', t.iconBg)}>
        <Icon className={cn('h-4 w-4', t.iconColor)} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
        <p className={cn('mt-0.5 font-display text-lg font-bold tabular-nums leading-tight sm:text-xl', t.value)}>{value}</p>
        {sub && <p className="truncate text-[11px] text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

export function ReportCard({ title, subtitle, icon: Icon, children }: { title: string; subtitle?: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <section className="surface overflow-hidden">
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-100">
            <Icon className="h-4 w-4 text-brand-600" />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-slate-900 sm:text-base">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
      </header>
      <div className="overflow-x-auto px-5 py-4 sm:px-6 sm:py-5">
        {children}
      </div>
    </section>
  );
}

// Animated, interactive chart card — vivid VIZ visuals on top of report sections.
export function ChartCard({ title, subtitle, icon: Icon, children, className, delay = 0 }: {
  title: string; subtitle?: string; icon: React.ElementType; children: React.ReactNode; className?: string; delay?: number;
}) {
  return (
    <section
      className={cn(
        'surface surface-hover overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-500 [animation-fill-mode:both]',
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand-100">
            <Icon className="h-4 w-4 text-brand-600" />
          </div>
          <div>
            <h2 className="font-display text-sm font-bold text-slate-900 sm:text-base">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
      </header>
      <div className="px-3 py-4 sm:px-5 sm:py-5">
        {children}
      </div>
    </section>
  );
}
