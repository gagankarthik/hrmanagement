import type { Metadata } from 'next';
import Link from 'next/link';
import {
  UsersRound, Network, CalendarDays, Wallet, ShieldCheck, BookOpen, ArrowRight, Lock,
} from 'lucide-react';
import { BRAND } from '@/config/brand';
import { SiteNav } from '@/components/landing/SiteNav';
import { SiteFooter } from '@/components/landing/SiteFooter';
import { ConsolePreview } from '@/components/landing/ConsolePreview';
import { Reveal } from '@/components/landing/Reveal';
import { Cta, Eyebrow } from '@/components/landing/ui';

export const metadata: Metadata = {
  title: 'The platform',
  description: `The workforce portal ${BRAND.legalName} runs on: people, partners, time, billing and compliance in one connected set of records.`,
  alternates: { canonical: '/platform' },
  openGraph: {
    title: `The platform · ${BRAND.name}`,
    description: `The workforce portal ${BRAND.legalName} runs on, and the records it keeps.`,
    url: '/platform',
  },
};

/**
 * The spine of the data model. This is the one thing that makes the portal
 * different from five separate tools, so it leads the page.
 */
const spine = [
  { step: 'Person', body: 'One record per worker, whatever their engagement type.' },
  { step: 'Placement', body: 'Who they work for: client, end client, vendor or subcontractor.' },
  { step: 'Hours', body: 'Timesheets against that placement, at a bill and pay rate.' },
  { step: 'Invoice', body: 'Approved hours become a client invoice, and a visible margin.' },
];

/** Each cell names the records it owns, in the app's own vocabulary. */
const modules = [
  {
    icon: UsersRound,
    records: 'employees · onboarding packets',
    title: 'People',
    body: 'W-2, contract, 1099 and offshore workers on one record, from the offer through offboarding.',
    chips: ['Profiles', 'Assignments', 'Bulk import'],
    wide: true,
  },
  {
    icon: Network,
    records: 'clients · end clients · vendors · subcontractors',
    title: 'Partners',
    body: 'Who the work is for, and who supplies it, with the roster attached to each.',
  },
  {
    icon: CalendarDays,
    records: 'leave requests · attendance',
    title: 'Time',
    body: 'Requests, approvals, balances and the daily clock, all in the open.',
  },
  {
    icon: Wallet,
    records: 'timesheets · invoices · margins',
    title: 'Billing',
    body: 'Hours roll into invoices, and the margin stays visible while the work is still running.',
    chips: ['Bill and pay rates', 'Approvals', 'Client invoices'],
    wide: true,
  },
  {
    icon: ShieldCheck,
    records: 'I-9 · I-983 · work authorization',
    title: 'Compliance',
    body: 'Verification status, retention dates, and expiry warnings that arrive before the deadline does.',
  },
  {
    icon: BookOpen,
    records: 'handbook · policies · benefits',
    title: 'Company',
    body: 'One current version of every document, readable by everyone.',
  },
];

/** What each tier actually opens. The boundary the portal enforces. */
const selfService = [
  { href: '/my-leave', label: 'My Leave', note: 'Request time off, follow approvals' },
  { href: '/my-attendance', label: 'My Attendance', note: 'Clock in and out, see your hours' },
  { href: '/my-documents', label: 'My Documents', note: 'Paystubs, letters and records' },
  { href: '/handbook', label: 'Handbook & policies', note: 'Company procedures, always current' },
  { href: '/benefits', label: 'Benefits', note: 'Your coverage and enrollment' },
];

const fullAccess = [
  'Every employee record, onboarding packet and placement',
  'Clients, end clients, vendors and subcontractors',
  'Leave approvals and workforce attendance',
  'Timesheets, invoicing and margins',
  'I-9, I-983 and document retention',
  'Reports, user administration and backups',
];

export default function PlatformPage() {
  return (
    <main id="main" className="horizon relative w-full bg-[var(--hz-canvas)]">
      <SiteNav />

      {/* ── Hero: the claim, and the thing itself ── */}
      <section className="relative w-full overflow-hidden bg-[var(--hz-canvas)]">
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
          style={{ background: 'radial-gradient(46% 38% at 82% 12%, rgba(29,78,216,0.07) 0%, transparent 65%)' }}
        />

        <div className="relative mx-auto w-full max-w-7xl px-6 pb-16 pt-28 sm:px-8 sm:pb-20 md:pt-32 lg:pb-24 lg:pt-36 2xl:max-w-[96rem]">
          <div className="grid items-center gap-10 sm:gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
            <div className="max-w-xl">
              <span className="animate-in fade-in slide-in-from-bottom-2 duration-700 [animation-fill-mode:both]">
                <Eyebrow>The platform</Eyebrow>
              </span>
              <h1 className="hz-display mt-6 text-[clamp(2.1rem,4.6vw,3.6rem)] text-[var(--hz-text)] animate-in fade-in slide-in-from-bottom-3 duration-700 [animation-delay:100ms] [animation-fill-mode:both]">
                One login.{' '}
                <span className="text-[var(--hz-cobalt)]">Every record the work runs on.</span>
              </h1>
              <p className="mt-6 max-w-lg text-[16px] leading-relaxed text-[var(--hz-text-mute)] animate-in fade-in slide-in-from-bottom-3 duration-700 [animation-delay:200ms] [animation-fill-mode:both] sm:text-[17px]">
                {BRAND.legalName} runs on its own workforce portal, built in-house and used by
                everyone here. People, placements, time, billing and compliance sit in one connected
                set of records instead of five systems that disagree.
              </p>
              <div className="mt-8 flex flex-col items-start gap-3 animate-in fade-in slide-in-from-bottom-3 duration-700 [animation-delay:300ms] [animation-fill-mode:both] sm:flex-row sm:items-center sm:mt-9">
                <Cta href="/login" variant="primary" icon="arrow">Sign in</Cta>
                <Cta href="/" variant="ghostLight">About {BRAND.name}</Cta>
              </div>
            </div>

            <ConsolePreview />
          </div>
        </div>
      </section>

      {/* ── The spine: why it is one system and not five ── */}
      <section className="w-full border-y border-[var(--hz-band-line)] bg-[var(--hz-band)] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 2xl:max-w-[96rem]">
          <Reveal className="max-w-2xl">
            <Eyebrow>How it fits together</Eyebrow>
            <h2 className="hz-display mt-4 text-[clamp(1.75rem,3.4vw,2.4rem)] text-[var(--hz-text)]">
              One chain, end to end.
            </h2>
            <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-[var(--hz-text-mute)]">
              A person carries their placements, placements carry the hours, and the hours carry the
              invoice. Nothing is retyped between steps, so nothing drifts.
            </p>
          </Reveal>

          <ol className="mt-12 grid gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
            {spine.map((s, i) => (
              <Reveal key={s.step} delay={i * 90} as="li" className="relative">
                <div className="h-full rounded-2xl border border-[var(--hz-band-line)] bg-white p-6 lg:mr-4 lg:rounded-none lg:border-0 lg:border-t-2 lg:border-t-[var(--hz-cobalt)]/20 lg:bg-transparent lg:p-0 lg:pr-8 lg:pt-5">
                  <div className="flex items-center gap-3">
                    <span className="hz-eyebrow text-[var(--hz-amber)]">{`0${i + 1}`}</span>
                    <span className="hz-display text-[1.2rem] text-[var(--hz-text)]">{s.step}</span>
                  </div>
                  <p className="mt-2 max-w-xs text-[14px] leading-relaxed text-[var(--hz-text-mute)]">{s.body}</p>
                </div>
                {i < spine.length - 1 && (
                  <ArrowRight
                    aria-hidden
                    className="absolute -right-1 top-4 hidden h-4 w-4 text-[var(--hz-cobalt)]/40 lg:block"
                    strokeWidth={2}
                  />
                )}
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Modules — dark bento band ── */}
      <section className="relative isolate w-full overflow-hidden" style={{ background: '#07142b' }}>
        <div
          aria-hidden
          className="absolute inset-0 z-0"
          style={{
            background:
              'radial-gradient(50% 60% at 8% 0%, rgba(29,78,216,0.35), transparent 60%), radial-gradient(40% 55% at 96% 100%, rgba(42,216,239,0.12), transparent 62%)',
          }}
        />
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-20 sm:px-8 sm:py-24 2xl:max-w-[96rem]">
          <Reveal className="max-w-2xl">
            <Eyebrow tone="dark">What&apos;s inside</Eyebrow>
            <h2 className="hz-display mt-4 text-[clamp(1.75rem,3.4vw,2.4rem)] text-white">
              Six families of records.
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map((m, i) => (
              <Reveal key={m.title} delay={i * 70} className={m.wide ? 'sm:col-span-2' : ''}>
                <div className="group flex h-full flex-col rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:bg-white/[0.07] hover:ring-white/20 sm:p-7">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.06] text-[var(--hz-cyan-400)] ring-1 ring-white/10" aria-hidden>
                    <m.icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <h3 className="hz-display mt-5 text-[1.2rem] text-white">{m.title}</h3>
                  <p className="hz-eyebrow mt-2 normal-case tracking-[0.06em] text-[var(--hz-cyan-400)]/70">
                    {m.records}
                  </p>
                  <p className="mt-3 text-[14px] leading-relaxed text-white/60">{m.body}</p>
                  {m.chips && (
                    <div className="mt-auto flex flex-wrap gap-2 pt-5">
                      {m.chips.map((c) => (
                        <span key={c} className="rounded-full border border-white/10 px-2.5 py-1 text-[12px] font-medium text-white/70">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who sees what ── */}
      <section className="w-full bg-[var(--hz-canvas)] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 2xl:max-w-[96rem]">
          <Reveal className="max-w-2xl">
            <span aria-hidden className="block h-[3px] w-12 rounded-full bg-[var(--hz-amber)]" />
            <h2 className="hz-display mt-6 text-[clamp(1.75rem,3.4vw,2.4rem)] text-[var(--hz-text)]">
              What your account opens.
            </h2>
            <p className="mt-4 max-w-lg text-[15.5px] leading-relaxed text-[var(--hz-text-mute)]">
              Access is shaped by role and enforced by the system. Everyone runs their own working
              life. HR and administrators run the rest.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-4 sm:mt-14 lg:grid-cols-2 lg:gap-6">
            <Reveal>
              <div className="flex h-full flex-col rounded-2xl border border-[var(--hz-line)] bg-white p-6 shadow-[var(--hz-shadow-sm)] sm:p-8">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="hz-display text-[1.3rem] text-[var(--hz-text)]">Everyone</h3>
                  <span className="hz-eyebrow text-[var(--hz-text-subtle)]">Self-service</span>
                </div>
                <p className="mt-2.5 text-[14px] leading-relaxed text-[var(--hz-text-mute)]">
                  Yours the moment you sign in. No tickets, no waiting on email.
                </p>
                <ul className="mt-6 flex-1">
                  {selfService.map((s, i) => (
                    <li key={s.href}>
                      <Link
                        href={s.href}
                        className={`group flex items-center gap-4 py-3.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hz-cobalt)] ${
                          i > 0 ? 'border-t border-[var(--hz-line)]' : ''
                        }`}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-semibold text-[var(--hz-text)] transition-colors group-hover:text-[var(--hz-cobalt)]">
                            {s.label}
                          </span>
                          <span className="mt-0.5 block text-[13px] text-[var(--hz-text-subtle)]">{s.note}</span>
                        </span>
                        <ArrowRight
                          className="h-4 w-4 flex-none text-[var(--hz-text-subtle)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:text-[var(--hz-cobalt)]"
                          strokeWidth={1.75}
                          aria-hidden
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div className="flex h-full flex-col rounded-2xl border border-[var(--hz-band-line)] bg-[var(--hz-band)] p-6 sm:p-8">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="hz-display text-[1.3rem] text-[var(--hz-text)]">HR and admin</h3>
                  <span className="hz-eyebrow text-[var(--hz-text-subtle)]">Full access</span>
                </div>
                <p className="mt-2.5 text-[14px] leading-relaxed text-[var(--hz-text-mute)]">
                  The console behind the portal, for the people who run it.
                </p>
                <ul className="mt-6 flex-1 space-y-3.5">
                  {fullAccess.map((f) => (
                    <li key={f} className="flex gap-3 text-[14.5px] leading-relaxed text-[var(--hz-text)]">
                      <span aria-hidden className="mt-[0.6em] h-1 w-1 flex-none rounded-full bg-[var(--hz-cobalt)]" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-7 flex items-center gap-2 border-t border-[var(--hz-band-line)] pt-5 text-[13px] text-[var(--hz-text-subtle)]">
                  <Lock className="h-3.5 w-3.5 flex-none" strokeWidth={1.75} aria-hidden />
                  Visible to HR and administrators only.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="w-full border-t border-[var(--hz-band-line)] bg-[var(--hz-band)]">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-6 py-14 sm:px-8 sm:py-16 lg:flex-row lg:items-center 2xl:max-w-[96rem]">
          <Reveal className="max-w-xl">
            <h2 className="hz-display text-[clamp(1.5rem,2.8vw,2rem)] text-[var(--hz-text)]">
              Already on the team?
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--hz-text-mute)]">
              Sign in for your leave, attendance, documents and benefits. Accounts are created by HR,
              and this portal keeps its own sign-in.
            </p>
          </Reveal>
          <Reveal delay={120} className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Cta href="/login" variant="primary" icon="arrow">Sign in</Cta>
            <Cta href="/signup" variant="ghostLight">How to get access</Cta>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
