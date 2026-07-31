// Reusable presentational atoms shared across the report tabs: filter selects,
// summary stats, and the section/chart card shells — all in the console (adm)
// language so Reports reads like the rest of the app.

import React from 'react';
import { cn } from '@/lib/utils';
import { FilterSelect as Select } from '@/components/ui/filter-select';

/** Labelled filter — a visible label over the shared console select. */
export function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="eyebrow">{label}</span>
      <Select value={value} onChange={onChange} options={options} className="w-full" />
    </label>
  );
}

/** Semantic value colors only — the chip stays neutral like every console tile. */
const SUMMARY_VALUE: Record<string, string> = {
  brand: 'text-[var(--adm-ink)]',
  emerald: 'text-[var(--adm-success)]',
  purple: 'text-[var(--adm-ink)]',
  amber: 'text-[var(--adm-warning)]',
  red: 'text-[var(--adm-danger)]',
  sky: 'text-[var(--adm-ink)]',
  slate: 'text-[var(--adm-ink-mute)]',
};

export function SummaryStat({ icon: Icon, label, value, sub, tone }: { icon: React.ElementType; label: string; value: string; sub?: string; tone: keyof typeof SUMMARY_VALUE }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-[6px] bg-[var(--adm-surface-2)] text-[var(--adm-ink-subtle)]">
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--adm-ink-subtle)]">{label}</p>
        <p className={cn('mt-0.5 text-[17px] font-bold tabular-nums leading-tight tracking-[-0.01em]', SUMMARY_VALUE[tone])}>{value}</p>
        {sub && <p className="truncate text-[11px] text-[var(--adm-ink-mute)]">{sub}</p>}
      </div>
    </div>
  );
}

function CardHeader({ title, subtitle, icon: Icon }: { title: string; subtitle?: string; icon: React.ElementType }) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-[var(--adm-line)] px-5 py-3.5 sm:px-6">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[6px] bg-[var(--adm-surface-2)] text-[var(--adm-ink-subtle)]">
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-[14px] font-semibold text-[var(--adm-ink)]">{title}</h2>
          {subtitle && <p className="truncate text-[12.5px] text-[var(--adm-ink-mute)]">{subtitle}</p>}
        </div>
      </div>
    </header>
  );
}

export function ReportCard({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <section className="surface overflow-hidden">
      <CardHeader title={title} subtitle={subtitle} icon={icon} />
      <div className="overflow-x-auto px-5 py-4 sm:px-6 sm:py-5">
        {children}
      </div>
    </section>
  );
}

/** Chart card — same shell; charts carry the color, the frame stays quiet. */
export function ChartCard({ title, subtitle, icon, children, className }: {
  title: string; subtitle?: string; icon: React.ElementType; children: React.ReactNode; className?: string; delay?: number;
}) {
  return (
    <section className={cn('surface overflow-hidden', className)}>
      <CardHeader title={title} subtitle={subtitle} icon={icon} />
      <div className="px-3 py-4 sm:px-5 sm:py-5">
        {children}
      </div>
    </section>
  );
}
