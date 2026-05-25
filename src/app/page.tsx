import React from 'react';
import Link from 'next/link';
import {
  Users, Building2, UserCheck, ShieldCheck,
  PieChart, UserPlus, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandMark } from '@/components/ui/brand-mark';
import { SiteNav } from '@/components/landing/SiteNav';
import { HeroActions } from '@/components/landing/HeroActions';

const IMG = '?auto=format&fit=crop&w=1600&q=80';
const photos = {
  hero: `https://images.unsplash.com/photo-1521737604893-d14cc237f11d${IMG}`,
  meeting: `https://images.unsplash.com/photo-1600880292203-757bb62b4baf${IMG}`,
  working: `https://images.unsplash.com/photo-1556761175-b413da4baf72${IMG}`,
  discussion: `https://images.unsplash.com/photo-1551836022-d5d88e9218df${IMG}`,
  office: `https://images.unsplash.com/photo-1497215728101-856f4ea42174${IMG}`,
};

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#how', label: 'How it works' },
  { href: '#security', label: 'Security' },
];

const features = [
  {
    icon: Users,
    title: 'Unified employee records',
    body: 'Manage W-2, contract, 1099, and offshore staff in one place — with the fields, pay, and status each type actually needs.',
  },
  {
    icon: Building2,
    title: 'Clients & vendors',
    body: 'Track where every person is placed across clients and vendors, including start and end dates for each assignment.',
  },
  {
    icon: UserCheck,
    title: 'Subcontractor management',
    body: 'Maintain subcontractor firms and assign employees to them with clear engagement periods.',
  },
  {
    icon: ShieldCheck,
    title: 'Compliance you can act on',
    body: 'Surface expiring work authorizations and documentation before they lapse, so nothing slips through.',
  },
  {
    icon: PieChart,
    title: 'Analytics & reporting',
    body: 'Headcount, utilization, billable mix, and placement breakdowns — with exportable reports for stakeholders.',
  },
  {
    icon: UserPlus,
    title: 'Guided onboarding',
    body: 'A structured onboarding flow that captures every detail correctly the first time, with drafts saved as you go.',
  },
];

const steps = [
  { n: '01', title: 'Add your people', body: 'Onboard employees by type and capture their pay, documents, and contact details.' },
  { n: '02', title: 'Map relationships', body: 'Link each person to the clients, vendors, and subcontractors they work with.' },
  { n: '03', title: 'Track & report', body: 'Monitor compliance and headcount, then export the reports your team relies on.' },
];

const securityPoints = [
  'Authentication with Amazon Cognito',
  'Data stored in your own AWS account (DynamoDB)',
  'Server-side credentials, never exposed to the browser',
  'Role-ready, audit-friendly employee records',
];

function FooterLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('flex items-center gap-2.5', className)} aria-label="ZenHR home">
      <BrandMark size={36} variant="light" className="shadow-sm" />
      <span className="font-display text-lg font-bold tracking-tight text-white">ZenHR</span>
    </Link>
  );
}

export default function LandingPage() {
  return (
    <main className="relative min-h-screen bg-[#fbf6ef] text-slate-700">
      {/* Warm atmosphere — soft brand tints, no fake UI */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden
        style={{
          backgroundImage:
            'radial-gradient(80% 60% at 100% 0%, rgba(29,100,87,0.06) 0%, transparent 50%), radial-gradient(70% 60% at 0% 0%, rgba(3,54,61,0.05) 0%, transparent 48%)',
        }}
      />

      {/* ── Nav (auth-aware, sticky, responsive) ── */}
      <SiteNav />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-[#ece5d9]">
        {/* Designed hero backdrop — green gradient mesh + masked dot grid */}
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
          <div className="absolute -right-40 -top-44 h-[42rem] w-[42rem] rounded-full bg-gradient-to-br from-brand-200/60 via-brand-300/30 to-transparent blur-3xl" />
          <div className="absolute -left-32 top-48 h-[26rem] w-[26rem] rounded-full bg-brand-100/55 blur-3xl" />
          <div className="absolute bottom-[-10rem] right-1/3 h-80 w-80 rounded-full bg-brand-400/15 blur-3xl" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(rgba(3,54,61,0.09) 1px, transparent 1px)',
              backgroundSize: '22px 22px',
              WebkitMaskImage: 'radial-gradient(125% 95% at 78% 8%, #000 0%, transparent 62%)',
              maskImage: 'radial-gradient(125% 95% at 78% 8%, #000 0%, transparent 62%)',
            }}
          />
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-16 sm:px-8 sm:pb-24 sm:pt-24 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Copy */}
          <div className="max-w-2xl">
            <p className="eyebrow">Workforce platform for staffing teams</p>
            <h1 className="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight text-brand-900 sm:text-5xl lg:text-6xl">
              Workforce management built for staffing teams
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
              ZenHR brings your W-2, contract, 1099, and offshore workforce into a single system —
              with the client, vendor, and subcontractor relationships, compliance tracking, and
              reporting that staffing operations actually need.
            </p>
            <div className="mt-8">
              <HeroActions />
            </div>
            <p className="mt-10 text-sm font-medium text-slate-500">
              Supports four employment classes — W-2 · Contract · 1099 · Offshore
            </p>
          </div>

          {/* Hero visual — real photo, framed to fit the warm theme */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl border border-[#ece5d9] bg-white shadow-[0_30px_60px_-30px_rgba(3,54,61,0.45)] ring-1 ring-black/[0.03]">
              <div className="aspect-[4/3]">
                <img
                  src={photos.hero}
                  alt="A team collaborating around a table in a bright workspace"
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              {/* Warm brand tint to integrate the photo with the cream canvas */}
              <div
                className="pointer-events-none absolute inset-0"
                aria-hidden
                style={{
                  background:
                    'linear-gradient(180deg, rgba(3,54,61,0.04) 0%, transparent 35%, rgba(3,54,61,0.12) 100%)',
                }}
              />
            </div>
            {/* Subtle floating accent photo for depth (hidden on small screens) */}
            <div className="absolute -bottom-8 -left-8 hidden w-44 overflow-hidden rounded-2xl border border-[#ece5d9] bg-white shadow-xl ring-1 ring-black/[0.03] sm:block">
              <div className="aspect-[4/3]">
                <img
                  src={photos.discussion}
                  alt="Colleagues in discussion"
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="border-t border-[#ece5d9] bg-white/50">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
              Everything you need to manage your workforce
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Purpose-built for the way staffing and consulting firms operate — not a generic HR tool bent to fit.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="surface surface-hover p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 ring-1 ring-brand-100">
                  <f.icon className="h-5 w-5 text-brand-700" strokeWidth={1.75} />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-brand-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Showcase: photo + value points ── */}
      <section className="border-t border-[#ece5d9]">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-2">
          <div className="relative order-2 lg:order-1">
            <div className="overflow-hidden rounded-3xl border border-[#ece5d9] bg-white shadow-[0_24px_50px_-28px_rgba(3,54,61,0.4)] ring-1 ring-black/[0.03]">
              <div className="aspect-[3/2]">
                <img
                  src={photos.meeting}
                  alt="An office team in a planning meeting"
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <p className="eyebrow">One source of truth</p>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
              Keep every placement and relationship in view
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              From the first onboarding step to the day an engagement ends, ZenHR keeps your people,
              the clients and vendors they serve, and the documents that keep them compliant connected
              in one record.
            </p>
            <ul className="mt-6 grid gap-3">
              {[
                'See active placements and assignment dates at a glance',
                'Catch expiring work authorizations before they lapse',
                'Export headcount and utilization for stakeholders',
              ].map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-50 ring-1 ring-brand-100">
                    <Check className="h-3 w-3 text-brand-700" strokeWidth={2.25} />
                  </span>
                  <span className="text-sm leading-relaxed text-slate-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="border-t border-[#ece5d9] bg-white/50">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <h2 className="font-display text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
            Up and running in three steps
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="relative">
                <span className="font-display text-5xl font-bold text-brand-200">{s.n}</span>
                <h3 className="mt-3 font-display text-xl font-bold text-brand-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security / enterprise ── */}
      <section id="security" className="relative overflow-hidden border-t border-[#ece5d9] bg-brand-900 text-white">
        {/* Subtle photo backdrop, heavily tinted into the brand green */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <img
            src={photos.office}
            alt=""
            aria-hidden
            loading="lazy"
            className="h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-950 via-brand-900/95 to-brand-900/80" />
        </div>
        <div className="relative mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Built on your own AWS account
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/70">
              Your workforce data stays in infrastructure you control. Authentication and storage
              run on AWS, and credentials never reach the browser.
            </p>
          </div>
          <ul className="grid gap-3">
            {securityPoints.map((p) => (
              <li key={p} className="flex items-start gap-3 rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand-400/20">
                  <Check className="h-3 w-3 text-brand-300" strokeWidth={2.25} />
                </span>
                <span className="text-sm text-white/90">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-[#ece5d9]">
        <div className="mx-auto max-w-6xl px-5 py-16 text-center sm:px-8 sm:py-24">
          <h2 className="font-display text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
            Bring your workforce into one system
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-600">
            Open the dashboard and see your team, clients, vendors, and compliance at a glance.
          </p>
          <div className="mt-8 flex justify-center">
            <HeroActions align="center" />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-brand-950 text-white">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <FooterLogo />
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/55">
                Workforce management for staffing teams — W-2, contract, 1099, and offshore staff,
                with clients, vendors, subcontractors, and compliance unified in one system.
              </p>
            </div>

            <div className="lg:col-span-2 lg:col-start-7">
              <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">Product</h4>
              <ul className="mt-4 space-y-3">
                {navLinks.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} className="text-sm text-white/70 transition-colors hover:text-white">{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">Company</h4>
              <ul className="mt-4 space-y-3">
                <li><a href="#security" className="text-sm text-white/70 transition-colors hover:text-white">Security</a></li>
                <li><a href="#how" className="text-sm text-white/70 transition-colors hover:text-white">How it works</a></li>
                <li><a href="mailto:hello@zenhr.app" className="text-sm text-white/70 transition-colors hover:text-white">Contact</a></li>
              </ul>
            </div>

            <div className="lg:col-span-2">
              <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">Account</h4>
              <ul className="mt-4 space-y-3">
                <li><Link href="/login" className="text-sm text-white/70 transition-colors hover:text-white">Log in</Link></li>
                <li><Link href="/signup" className="text-sm text-white/70 transition-colors hover:text-white">Get started</Link></li>
                <li><Link href="/dashboard" className="text-sm text-white/70 transition-colors hover:text-white">Dashboard</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
            <p className="text-xs text-white/50">© {new Date().getFullYear()} ZenHR. All rights reserved.</p>
            <div className="flex items-center gap-5">
              <a href="#" className="text-xs text-white/50 transition-colors hover:text-white/80">Privacy</a>
              <a href="#" className="text-xs text-white/50 transition-colors hover:text-white/80">Terms</a>
              <span className="text-xs text-white/40">Built on AWS · Secure by design</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
