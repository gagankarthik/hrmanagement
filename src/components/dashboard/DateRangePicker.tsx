'use client';

import * as React from 'react';
import { CalendarRange, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardFilters, RANGE_OPTIONS, type RangePreset } from '@/context/DashboardFilterContext';

/**
 * Global dashboard date-range picker — presets + a custom range, driving the
 * shared DashboardFilterContext so every widget reacts to the same window.
 */
export function DateRangePicker() {
  const { range, rangeLabel, setRange, customStart, customEnd, setCustomRange } = useDashboardFilters();
  const [open, setOpen] = React.useState(false);
  const [cs, setCs] = React.useState(customStart);
  const [ce, setCe] = React.useState(customEnd);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const pick = (v: RangePreset) => { setRange(v); if (v !== 'custom') setOpen(false); };
  const applyCustom = () => { if (cs) { setCustomRange(cs, ce); setOpen(false); } };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-colors',
          range !== 'all'
            ? 'border-brand-200 bg-brand-50 text-brand-700'
            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <CalendarRange className="h-4 w-4" strokeWidth={1.75} />
        <span className="max-w-[10rem] truncate">{rangeLabel}</span>
        <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')} strokeWidth={1.75} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-30 mt-2 w-60 origin-top-right animate-in fade-in slide-in-from-top-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl duration-150"
        >
          {RANGE_OPTIONS.filter((o) => o.value !== 'custom').map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => pick(o.value)}
              className={cn(
                'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
                range === o.value ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50',
              )}
            >
              {o.label}
              {range === o.value && <Check className="h-4 w-4" strokeWidth={2} />}
            </button>
          ))}

          <div className="my-1.5 border-t border-slate-100" />
          <div className="px-2 py-1">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Custom range</p>
            <div className="flex flex-col gap-2">
              <input type="date" value={cs} onChange={(e) => setCs(e.target.value)} className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 focus:border-brand-400 focus:outline-none" />
              <input type="date" value={ce} onChange={(e) => setCe(e.target.value)} min={cs || undefined} className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 focus:border-brand-400 focus:outline-none" />
              <button
                type="button"
                onClick={applyCustom}
                disabled={!cs}
                className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
