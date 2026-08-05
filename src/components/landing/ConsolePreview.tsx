import React from 'react';
import {
  LayoutDashboard, UsersRound, CalendarDays, Wallet, ShieldCheck, Clock, FileText,
} from 'lucide-react';

/**
 * A stylized window of the console itself, built from markup rather than a
 * screenshot so it stays sharp, themeable and never goes stale against the real
 * product. Decorative: the whole thing is hidden from assistive technology,
 * since the page text already says what the portal does.
 */

const railIcons = [LayoutDashboard, UsersRound, CalendarDays, Wallet, ShieldCheck];

const kpis = [
  { label: 'Active workforce', value: '128' },
  { label: 'Placements', value: '96' },
  { label: 'Auth expiring', value: '3' },
];

const rows = [
  {
    icon: CalendarDays,
    title: 'Leave request · Apr 14 to 18',
    sub: 'Priya Nair · 5 days',
    chip: 'Approved',
    chipCls: 'bg-emerald-50 text-emerald-700',
  },
  {
    icon: Clock,
    title: 'Timesheet · week of Apr 7',
    sub: 'Northwind Systems · 40.0 hours',
    chip: 'Submitted',
    chipCls: 'bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]',
  },
  {
    icon: FileText,
    title: 'I-9 reverification',
    sub: 'Section 3 complete',
    chip: 'On file',
    chipCls: 'bg-slate-100 text-slate-600',
  },
];

export function ConsolePreview() {
  return (
    <div
      aria-hidden
      className="relative animate-in fade-in slide-in-from-bottom-4 duration-1000 [animation-delay:250ms] [animation-fill-mode:both]"
    >
      <div
        className="pointer-events-none absolute -inset-8 -z-10 rounded-[3rem]"
        style={{ background: 'radial-gradient(60% 60% at 50% 40%, rgba(29,78,216,0.14) 0%, transparent 70%)' }}
      />

      {/* Machined bezel: padded shell, inner radius = outer − 6 */}
      <div className="bg-black/[0.045] p-1.5 ring-1 ring-black/[0.05]" style={{ borderRadius: 28 }}>
        <div
          className="overflow-hidden border border-[var(--hz-line)] bg-white"
          style={{ borderRadius: 22, boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.75), var(--hz-shadow-lg)' }}
        >
          {/* Window bar */}
          <div className="flex items-center gap-2 border-b border-[var(--hz-line)] bg-[var(--hz-surface)] px-4 py-2.5">
            <span className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#fca5a5]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#fcd34d]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#86efac]" />
            </span>
            <span className="hz-eyebrow mx-auto normal-case tracking-[0.06em] text-[var(--hz-text-subtle)]">
              hr.oceanbluecorp.com
            </span>
            <span className="w-10" />
          </div>

          <div className="grid grid-cols-[52px_1fr] sm:grid-cols-[60px_1fr]">
            {/* Mini nav rail */}
            <div className="flex flex-col items-center gap-2 border-r border-[var(--hz-line)] bg-[var(--hz-surface)] py-4">
              {railIcons.map((Icon, i) => (
                <span
                  key={i}
                  className={
                    i === 0
                      ? 'grid h-8 w-8 place-items-center rounded-lg bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]'
                      : 'grid h-8 w-8 place-items-center rounded-lg text-[var(--hz-text-subtle)]'
                  }
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
              ))}
            </div>

            {/* Content pane */}
            <div className="p-4 sm:p-5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[15px] font-semibold text-[var(--hz-text)]">Workforce</p>
                <p className="hz-eyebrow text-[var(--hz-text-subtle)]">Mon · Apr 13</p>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2.5">
                {kpis.map((k) => (
                  <div key={k.label} className="rounded-xl border border-[var(--hz-line)] bg-white p-2.5 sm:p-3">
                    <p className="hz-eyebrow truncate text-[var(--hz-text-subtle)]">{k.label}</p>
                    <p className="hz-display mt-1.5 text-[17px] text-[var(--hz-text)] sm:text-[19px]">{k.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-[var(--hz-line)]">
                {rows.map((r, i) => (
                  <div
                    key={r.title}
                    className={`flex items-center gap-3 bg-white px-3 py-2.5 sm:px-3.5 ${i > 0 ? 'border-t border-[var(--hz-line)]' : ''}`}
                  >
                    <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-[var(--hz-surface-2)] text-[var(--hz-text-mute)]">
                      <r.icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-semibold text-[var(--hz-text)] sm:text-[13px]">{r.title}</span>
                      <span className="block truncate text-[11.5px] text-[var(--hz-text-subtle)]">{r.sub}</span>
                    </span>
                    <span className={`flex-none rounded-[4px] px-1.5 py-px text-[10px] font-semibold uppercase tracking-[0.03em] ${r.chipCls}`}>
                      {r.chip}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
