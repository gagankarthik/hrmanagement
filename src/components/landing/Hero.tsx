'use client';

import React from 'react';
import {
  LayoutDashboard, UsersRound, CalendarDays, Wallet, ShieldCheck,
  CheckCircle2, FileText, Clock,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Cta, Eyebrow, WordsReveal } from '@/components/landing/ui';
import { HeroTide } from '@/components/landing/HeroTide';

/** Auth-aware hero actions in the shared Cta pill vocabulary. */
function HeroCtas() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center" aria-hidden>
        <div className="h-12 w-44 animate-pulse rounded-full bg-black/5" />
        <div className="h-12 w-40 animate-pulse rounded-full bg-black/5" />
      </div>
    );
  }
  if (isAuthenticated) {
    return (
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <Cta href="/dashboard" variant="primary" icon="arrow">Go to your dashboard</Cta>
        <Cta href="#platform" variant="ghostLight">Browse what&apos;s inside</Cta>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
      <Cta href="/login" variant="primary" icon="arrow">Sign in to continue</Cta>
      <Cta href="#platform" variant="ghostLight">Explore the portal</Cta>
    </div>
  );
}

/* ── Portal preview — a stylized product window built from real UI, no photos ── */

const railIcons = [LayoutDashboard, UsersRound, CalendarDays, Wallet, ShieldCheck];

const kpis = [
  { label: 'Leave balance', value: '12 days' },
  { label: 'Timesheet', value: 'Due Fri' },
  { label: 'Documents', value: '2 new' },
];

const rows = [
  {
    icon: CalendarDays,
    title: 'Leave request · Apr 14 to 18',
    sub: 'Reviewed by HR',
    chip: 'Approved',
    chipCls: 'bg-emerald-50 text-emerald-700',
  },
  {
    icon: Clock,
    title: 'Timesheet · week of Apr 7',
    sub: '40.0 hours',
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

function PortalPreview() {
  return (
    <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-1000 [animation-delay:250ms] [animation-fill-mode:both]">
      {/* Soft glow behind the frame */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-8 -z-10 rounded-[3rem]"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 40%, rgba(29,78,216,0.14) 0%, transparent 70%)',
        }}
      />

      {/* Machined bezel: padded shell, inner radius = outer − 6 */}
      <div className="bg-black/[0.045] p-1.5 ring-1 ring-black/[0.05]" style={{ borderRadius: 28 }}>
        <div
          className="overflow-hidden border border-[var(--hz-line)] bg-white shadow-[var(--hz-shadow-lg)]"
          style={{ borderRadius: 22, boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.75), var(--hz-shadow-lg)' }}
        >
          {/* Window bar */}
          <div className="flex items-center gap-2 border-b border-[var(--hz-line)] bg-[var(--hz-surface)] px-4 py-2.5">
            <span className="flex gap-1.5" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-[#fca5a5]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#fcd34d]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#86efac]" />
            </span>
            <span className="hz-eyebrow mx-auto normal-case tracking-[0.06em] text-[var(--hz-text-subtle)]">
              hr.oceanbluecorp.com
            </span>
            <span className="w-10" aria-hidden />
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
                  aria-hidden
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
              ))}
            </div>

            {/* Content pane */}
            <div className="p-4 sm:p-5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[15px] font-semibold text-[var(--hz-text)]">Good morning, Alex</p>
                <p className="hz-eyebrow text-[var(--hz-text-subtle)]">Mon · Apr 13</p>
              </div>

              {/* KPI tiles */}
              <div className="mt-4 grid grid-cols-3 gap-2.5">
                {kpis.map((k) => (
                  <div key={k.label} className="rounded-xl border border-[var(--hz-line)] bg-white p-2.5 sm:p-3">
                    <p className="hz-eyebrow text-[var(--hz-text-subtle)]">{k.label}</p>
                    <p className="hz-display mt-1.5 text-[15px] text-[var(--hz-text)] sm:text-[17px]">{k.value}</p>
                  </div>
                ))}
              </div>

              {/* Activity rows */}
              <div className="mt-4 overflow-hidden rounded-xl border border-[var(--hz-line)]">
                {rows.map((r, i) => (
                  <div
                    key={r.title}
                    className={`flex items-center gap-3 bg-white px-3 py-2.5 sm:px-3.5 ${i > 0 ? 'border-t border-[var(--hz-line)]' : ''}`}
                  >
                    <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-[var(--hz-surface-2)] text-[var(--hz-text-mute)]" aria-hidden>
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

      {/* Floating confirmation card */}
      <div className="absolute -bottom-5 -left-3 hidden items-center gap-2.5 rounded-2xl border border-[var(--hz-line)] bg-white/95 py-2.5 pl-3 pr-4 shadow-[var(--hz-shadow-md)] backdrop-blur transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 sm:flex">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-50 text-emerald-600" aria-hidden>
          <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className="text-[13px] font-semibold text-[var(--hz-text)]">
          Leave approved
          <span className="ml-1.5 font-normal text-[var(--hz-text-subtle)]">just now</span>
        </span>
      </div>
    </div>
  );
}

/**
 * Light, typographic hero: no photography, no slideshow. A quiet grid + tint
 * canvas, an oversized grotesque headline, and a product-window preview of the
 * portal itself. Deliberately a different composition from the company
 * homepage while speaking the same HORIZON language.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[var(--hz-canvas)]">
      {/* Quiet canvas: faint grid fading out from the top + one cobalt tint */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(15,23,42,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.035) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(75% 55% at 50% 0%, black 0%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(75% 55% at 50% 0%, black 0%, transparent 80%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(46% 38% at 82% 12%, rgba(29,78,216,0.07) 0%, transparent 65%)',
        }}
      />
      {/* The living bathymetric chart — Ocean Blue's own topography */}
      <HeroTide tone="light" />

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 px-6 pb-20 pt-28 sm:px-8 md:pt-32 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 lg:pb-28 lg:pt-36 2xl:max-w-[96rem]">
        <div className="max-w-xl">
          <span className="animate-in fade-in slide-in-from-bottom-2 duration-700 [animation-fill-mode:both]">
            <Eyebrow>Ocean Blue · Employee &amp; HR portal</Eyebrow>
          </span>

          <h1 className="hz-display mt-6 text-[clamp(2.4rem,5.2vw,4.4rem)] text-[var(--hz-text)]">
            <WordsReveal text="Work at Ocean Blue," delay={0.1} />{' '}
            <span className="text-[var(--hz-cobalt)]">
              <WordsReveal text="all in one place." delay={0.45} />
            </span>
          </h1>

          <p className="mt-6 max-w-md text-[16px] leading-relaxed text-[var(--hz-text-mute)] animate-in fade-in slide-in-from-bottom-3 duration-1000 [animation-delay:700ms] [animation-fill-mode:both] sm:text-[17px]">
            Your leave, documents, timesheets, and benefits, next to the records HR keeps running
            behind the scenes. Sign in and pick up where you left off.
          </p>

          <div className="mt-8 animate-in fade-in slide-in-from-bottom-3 duration-1000 [animation-delay:850ms] [animation-fill-mode:both] sm:mt-9">
            <HeroCtas />
          </div>

          <p className="mt-7 text-[13px] leading-relaxed text-[var(--hz-text-subtle)] animate-in fade-in duration-1000 [animation-delay:1000ms] [animation-fill-mode:both]">
            Access is provisioned by your administrator. One account works here and on the company
            site.
          </p>
        </div>

        <PortalPreview />
      </div>
    </section>
  );
}
