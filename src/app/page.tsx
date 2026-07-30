import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowUpRight, UsersRound, CalendarDays, Wallet, ShieldCheck,
  FolderOpen, BookOpen, HeartPulse, BarChart3,
} from 'lucide-react';
import { BRAND } from '@/config/brand';
import { SiteNav } from '@/components/landing/SiteNav';
import { Hero } from '@/components/landing/Hero';
import { Reveal } from '@/components/landing/Reveal';
import { Cta, Eyebrow } from '@/components/landing/ui';

const CONTACT_HREF = `mailto:${BRAND.contactEmail}?subject=${encodeURIComponent(`Portal access — ${BRAND.name}`)}`;

/* ════════════════════════════════  Content  ════════════════════════════════ */

// The module bento — two wide anchors, four standard cells.
const modules = [
  {
    icon: UsersRound,
    title: 'People & onboarding',
    body: 'Every employee, client, vendor, and subcontractor in one place, from offer letter to offboarding.',
    chips: ['Profiles', 'Onboarding packets', 'Bulk import', 'Assignments'],
    wide: true,
  },
  {
    icon: CalendarDays,
    title: 'Leave & attendance',
    body: 'Requests, approvals, and balances tracked in the open.',
  },
  {
    icon: ShieldCheck,
    title: 'Compliance',
    body: 'I-9, E-Verify tracking, and document retention with a full audit trail.',
  },
  {
    icon: BarChart3,
    title: 'Reports',
    body: 'Headcount, utilization, and margins without the spreadsheet ritual.',
  },
  {
    icon: BookOpen,
    title: 'Handbook & policies',
    body: 'Procedures and policy docs, always the current version.',
  },
  {
    icon: Wallet,
    title: 'Billing & timesheets',
    body: 'Hours roll into invoices and margins, so delivery and billing stay one story.',
    chips: ['Timesheets', 'Invoicing', 'Margins'],
    wide: true,
  },
];

// Self-service — the numbered editorial list.
const essRows = [
  {
    n: '01',
    href: '/my-leave',
    title: 'My Leave',
    body: 'Request time off in seconds, see balances, and follow approvals in real time.',
  },
  {
    n: '02',
    href: '/my-documents',
    title: 'My Documents',
    body: 'Paystubs, letters, and records, downloadable whenever you need them.',
  },
  {
    n: '03',
    href: '/handbook',
    title: 'Handbook & Policies',
    body: 'Company procedures and policies, kept current so you never read a stale copy.',
  },
  {
    n: '04',
    href: '/benefits',
    title: 'Benefits',
    body: 'Your coverage and enrollment, laid out in one view.',
  },
];

const footerLinks = [
  { href: '/login', label: 'Sign in' },
  { href: '/signup', label: 'Request access' },
  { href: '/my-leave', label: 'My Leave' },
  { href: '/handbook', label: 'Handbook' },
];

/* ════════════════════════════════  Page  ════════════════════════════════ */

export default function LandingPage() {
  return (
    <main id="main" className="horizon relative w-full bg-[var(--hz-canvas)]">
      <SiteNav />

      <Hero />

      {/* ── Modules — dark bento band ── */}
      <section id="platform" className="relative isolate w-full scroll-mt-20 overflow-hidden" style={{ background: '#07142b' }}>
        <div
          aria-hidden
          className="absolute inset-0 z-0"
          style={{
            background:
              'radial-gradient(50% 60% at 8% 0%, rgba(29,78,216,0.35), transparent 60%), radial-gradient(40% 55% at 96% 100%, rgba(42,216,239,0.12), transparent 62%)',
          }}
        />
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-20 sm:px-8 sm:py-28 2xl:max-w-[96rem]">
          <Reveal className="max-w-2xl">
            <Eyebrow tone="dark">What&apos;s inside</Eyebrow>
            <h2 className="hz-display mt-4 text-[1.9rem] text-white sm:text-[2.4rem]">
              One login. Every part of the job.
            </h2>
            <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-white/60 sm:text-[16px]">
              Six module families cover the work between people and paychecks, for HR and for
              everyone HR supports.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map((m, i) => (
              <Reveal key={m.title} delay={i * 70} className={m.wide ? 'sm:col-span-2' : ''}>
                <div className="group flex h-full flex-col rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:bg-white/[0.07] hover:ring-white/20 sm:p-7">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.06] text-[var(--hz-cyan-400)] ring-1 ring-white/10" aria-hidden>
                    <m.icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <h3 className="hz-display mt-5 text-[1.2rem] text-white">{m.title}</h3>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-white/60">{m.body}</p>
                  {m.chips && (
                    <div className="mt-auto flex flex-wrap gap-2 pt-5">
                      {m.chips.map((c) => (
                        <span
                          key={c}
                          className="rounded-full border border-white/10 px-2.5 py-1 text-[12px] font-medium text-white/70"
                        >
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

      {/* ── Self-service — numbered editorial list ── */}
      <section id="ess" className="relative w-full scroll-mt-20 bg-[var(--hz-canvas)] py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 sm:px-8 lg:grid-cols-12 lg:gap-16 2xl:max-w-[96rem]">
          <Reveal className="lg:col-span-4">
            <span aria-hidden className="block h-[3px] w-12 rounded-full bg-[var(--hz-amber)]" />
            <h2 className="hz-display mt-6 text-[1.9rem] text-[var(--hz-text)] sm:text-[2.4rem]">
              Serve yourself.
            </h2>
            <p className="mt-4 max-w-sm text-[15.5px] leading-relaxed text-[var(--hz-text-mute)]">
              No tickets, no waiting on email. The everyday things are yours to do directly, from
              any device.
            </p>
            <p className="mt-6 text-[13px] leading-relaxed text-[var(--hz-text-subtle)]">
              Available to everyone at {BRAND.legalName}, with access shaped to your role.
            </p>
          </Reveal>

          <div className="lg:col-span-8">
            {essRows.map((r, i) => (
              <Reveal key={r.n} delay={i * 80}>
                <Link
                  href={r.href}
                  className={`group grid grid-cols-[auto_1fr_auto] items-center gap-5 py-6 sm:gap-8 sm:py-7 ${
                    i > 0 ? 'border-t border-[var(--hz-line)]' : ''
                  }`}
                >
                  <span className="hz-eyebrow pt-1 text-[var(--hz-amber)]">{r.n}</span>
                  <span className="min-w-0">
                    <span className="hz-display block text-[1.25rem] text-[var(--hz-text)] transition-colors duration-300 group-hover:text-[var(--hz-cobalt)] sm:text-[1.4rem]">
                      {r.title}
                    </span>
                    <span className="mt-1.5 block max-w-lg text-[14px] leading-relaxed text-[var(--hz-text-mute)]">
                      {r.body}
                    </span>
                  </span>
                  <span
                    className="grid h-10 w-10 flex-none place-items-center rounded-full border border-[var(--hz-line-2)] text-[var(--hz-text-mute)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:border-[var(--hz-cobalt)] group-hover:bg-[var(--hz-cobalt)] group-hover:text-white sm:h-11 sm:w-11"
                    aria-hidden
                  >
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.75} />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Access strip — compact, tinted ── */}
      <section id="access" className="w-full scroll-mt-20 border-y border-[var(--hz-band-line)] bg-[var(--hz-band)]">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-6 py-14 sm:px-8 sm:py-16 lg:flex-row lg:items-center 2xl:max-w-[96rem]">
          <Reveal className="max-w-xl">
            <h2 className="hz-display text-[1.6rem] text-[var(--hz-text)] sm:text-[2rem]">
              Ready when you are.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--hz-text-mute)]">
              Sign in with your Ocean Blue account. New to the team? Ask HR to get you set up.
            </p>
          </Reveal>
          <Reveal delay={120} className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Cta href="/login" variant="primary" icon="arrow">Sign in</Cta>
            <Cta href={CONTACT_HREF} variant="ghostLight" icon="mail">Contact HR</Cta>
          </Reveal>
        </div>
      </section>

      {/* ── Footer — single compact band ── */}
      <footer className="w-full bg-[var(--hz-canvas)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 sm:px-8 2xl:max-w-[96rem]">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <Link href="/" className="inline-flex" aria-label={`${BRAND.name} home`}>
              <Image src="/logo.png" alt={BRAND.name} width={170} height={40} className="h-7 w-auto" />
            </Link>
            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2" aria-label="Footer">
              {footerLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-[13.5px] font-medium text-[var(--hz-text-mute)] transition-colors hover:text-[var(--hz-cobalt)]"
                >
                  {l.label}
                </Link>
              ))}
              <a
                href={`https://www.${BRAND.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13.5px] font-medium text-[var(--hz-text-mute)] transition-colors hover:text-[var(--hz-cobalt)]"
              >
                {BRAND.domain}
              </a>
            </nav>
          </div>
          <div className="flex flex-col items-center justify-between gap-2 border-t border-[var(--hz-line)] pt-6 text-[12.5px] text-[var(--hz-text-subtle)] sm:flex-row">
            <p>© {new Date().getFullYear()} {BRAND.legalName}. All rights reserved.</p>
            <p>Internal system. Access limited to authorized {BRAND.legalName} teams.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
