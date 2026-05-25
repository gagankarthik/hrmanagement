'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Users, Building2, Package, UserCheck, ShieldCheck,
  PieChart, UserPlus, ArrowRight, Menu, X, Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandMark } from '@/components/ui/brand-mark';

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

function Logo({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <BrandMark size={36} variant={onDark ? 'light' : 'dark'} className="shadow-sm" />
      <span className={cn('font-display text-lg font-bold tracking-tight', onDark ? 'text-white' : 'text-brand-900')}>
        ZenHR
      </span>
    </div>
  );
}

export default function LandingPage() {
  const [navOpen, setNavOpen] = useState(false);

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

      {/* ── Nav ── */}
      <header className="sticky top-0 z-40 border-b border-[#ece5d9] bg-[#fbf6ef]/85 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Logo />
          <div className="hidden items-center gap-8 lg:flex">
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} className="text-sm font-medium text-slate-600 transition-colors hover:text-brand-900">
                {l.label}
              </a>
            ))}
          </div>
          <div className="hidden items-center gap-3 lg:flex">
            <Link href="/login" className="text-sm font-semibold text-brand-900 hover:underline">Sign in</Link>
            <Link href="/dashboard" className="btn-primary">Open dashboard</Link>
          </div>
          <button
            onClick={() => setNavOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-brand-900 hover:bg-black/5 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </nav>
      </header>

      {/* Mobile drawer */}
      {navOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-brand-950/40 backdrop-blur-sm" onClick={() => setNavOpen(false)} />
          <div className="absolute right-0 top-0 flex h-full w-72 flex-col gap-1 border-l border-[#ece5d9] bg-[#fbf6ef] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <Logo />
              <button onClick={() => setNavOpen(false)} className="rounded-md p-1 text-slate-500" aria-label="Close menu"><X className="h-5 w-5" /></button>
            </div>
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setNavOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-black/5">
                {l.label}
              </a>
            ))}
            <Link href="/login" onClick={() => setNavOpen(false)} className="mt-2 rounded-lg border-t border-[#ece5d9] px-3 pt-4 text-sm font-medium text-slate-700">Sign in</Link>
            <Link href="/dashboard" onClick={() => setNavOpen(false)} className="btn-primary mt-3 w-full">Open dashboard</Link>
          </div>
        </div>
      )}

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

        <div className="mx-auto max-w-6xl px-5 pb-16 pt-16 sm:px-8 sm:pb-24 sm:pt-24">
          <div className="max-w-3xl">
            <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-brand-900 sm:text-5xl lg:text-6xl">
              Workforce management built for staffing teams
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
              ZenHR brings your W-2, contract, 1099, and offshore workforce into a single system —
              with the client, vendor, and subcontractor relationships, compliance tracking, and
              reporting that staffing operations actually need.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/dashboard" className="btn-primary group justify-center px-6 py-3 text-base sm:justify-start">
                Open dashboard
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/login" className="btn-ghost justify-center px-6 py-3 text-base sm:justify-start">
                Sign in
              </Link>
            </div>
            <p className="mt-10 text-sm font-medium text-slate-500">
              Supports four employment classes — W-2 · Contract · 1099 · Offshore
            </p>
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
                  <f.icon className="h-5 w-5 text-brand-700" />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-brand-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="border-t border-[#ece5d9]">
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
      <section id="security" className="border-t border-[#ece5d9] bg-brand-900 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-2 lg:items-center">
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
                  <Check className="h-3 w-3 text-brand-300" />
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
            <Link href="/dashboard" className="btn-primary group px-6 py-3 text-base">
              Open dashboard
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-brand-950 text-white">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-16">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <Logo onDark />
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/55">
                Workforce management for staffing teams — W-2, contract, 1099, and offshore staff,
                with clients, vendors, subcontractors, and compliance unified in one system.
              </p>
            </div>

            <div className="lg:col-span-3 lg:col-start-7">
              <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">Product</h4>
              <ul className="mt-4 space-y-3">
                {navLinks.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} className="text-sm text-white/70 transition-colors hover:text-white">{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-3">
              <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">Account</h4>
              <ul className="mt-4 space-y-3">
                <li><Link href="/login" className="text-sm text-white/70 transition-colors hover:text-white">Sign in</Link></li>
                <li><Link href="/dashboard" className="text-sm text-white/70 transition-colors hover:text-white">Open dashboard</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
            <p className="text-xs text-white/50">© {new Date().getFullYear()} ZenHR. All rights reserved.</p>
            <p className="text-xs text-white/40">Built on AWS · Secure by design</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
