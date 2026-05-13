'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, ArrowUpRight, Layers, Users, Shield, Cake, Award,
  Building2, Package, PieChart, FileText, Sparkles, Activity, Globe,
  AlertOctagon, AlertTriangle, UserMinus, Menu, X, ChevronRight,
  TrendingUp, Clock, CheckCircle2, UserCheck, UserPlus, MapPin,
  Briefcase, BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ──────────────────────────────────────────────────────────────
// Hooks
// ──────────────────────────────────────────────────────────────
function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!ref.current || seen) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setSeen(true)),
      { threshold }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [seen, threshold]);
  return { ref, seen };
}

function useCountUp(target: number, seen: boolean, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!seen) return;
    const start = performance.now();
    let raf: number;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, seen, duration]);
  return value;
}

// ──────────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [navOpen, setNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'operations' | 'analytics' | 'onboard'>('operations');

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <SiteNav onOpenMobile={() => setNavOpen(true)} />

      {/* Mobile nav drawer */}
      {navOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setNavOpen(false)} />
          <div className="absolute right-0 top-0 flex h-full w-72 flex-col gap-1 border-l border-slate-100 bg-white p-5 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">Menu</span>
              <button onClick={() => setNavOpen(false)} className="rounded-md p-1 text-slate-500"><X className="h-4 w-4" /></button>
            </div>
            {[
              { href: '#features', label: 'Features' },
              { href: '#preview', label: 'Preview' },
              { href: '#classes', label: 'Workforce' },
              { href: '#workflow', label: 'How it works' },
            ].map((l) => (
              <a key={l.href} href={l.href} onClick={() => setNavOpen(false)} className="rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                {l.label}
              </a>
            ))}
            <Link href="/login" onClick={() => setNavOpen(false)} className="mt-3 border-t border-slate-100 pt-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
              Sign in
            </Link>
            <Link href="/dashboard" onClick={() => setNavOpen(false)} className="mt-2 rounded-xl bg-indigo-600 px-3 py-2.5 text-center text-sm font-semibold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700">
              Open dashboard
            </Link>
          </div>
        </div>
      )}

      {/* ────────────── HERO ────────────── */}
      <section className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 pb-12 pt-10 sm:px-8 sm:pb-20 sm:pt-16 lg:px-12 lg:pb-24 lg:pt-20">
          <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
            {/* LEFT */}
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-indigo-700">
                <LiveDot tone="indigo" /> Workforce operations · v2
              </span>

              <h1
                className="mt-5 text-[2.5rem] font-bold leading-[0.96] tracking-tight text-slate-900 sm:text-6xl lg:text-[4.5rem] xl:text-[5.25rem]"
                style={{ fontFamily: 'var(--font-funnel), var(--font-geist-sans), system-ui, sans-serif', letterSpacing: '-0.025em' }}
              >
                Manage your<br />
                workforce with{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 text-indigo-600">clarity</span>
                  <span className="absolute -inset-x-1 bottom-1 -z-0 h-3 bg-indigo-100 sm:bottom-2 sm:h-4 lg:bottom-3 lg:h-5" />
                </span>
                <span className="text-indigo-600">.</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:mt-8 sm:text-lg">
                A workforce operations platform for W-2, contract, 1099 and offshore staffing.
                Live KPIs, compliance you can act on, and every employee event surfaced in one place.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/dashboard"
                  className="group inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-md active:translate-y-px"
                >
                  Launch dashboard
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <a
                  href="#preview"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Preview the product
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>

              {/* Inline trust row */}
              <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs sm:mt-12">
                <span className="inline-flex items-center gap-1.5 text-slate-500">
                  <LiveDot tone="emerald" /> Live data from your records
                </span>
                <span className="hidden h-3 w-px bg-slate-200 sm:inline-block" />
                <span className="inline-flex items-center gap-1.5 text-slate-500">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Four employment classes
                </span>
                <span className="hidden h-3 w-px bg-slate-200 sm:inline-block" />
                <span className="inline-flex items-center gap-1.5 text-slate-500">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Zero setup
                </span>
              </div>
            </div>

            {/* RIGHT — Dashboard preview card */}
            <HeroDashboardMock />
          </div>
        </div>
      </section>

      {/* ────────────── STATS ────────────── */}
      <StatsSection />

      {/* ────────────── FEATURE BENTO ────────────── */}
      <section id="features" className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
          <SectionHeader
            eyebrow="What's inside"
            title={<>Every workforce concern,<br className="hidden sm:inline" /> on a single canvas.</>}
            subtitle="Eight discrete capabilities, each one a click away. Nothing buried in nested menus."
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Operational Attention — wide tile */}
            <FeatureCard className="sm:col-span-2 lg:row-span-2" tone="rose" icon={AlertOctagon} title="Operational Attention" body="Expired authorizations, bench staff, fresh hires — surfaced at the top. Every row drills into the people behind the number.">
              <div className="mt-4 space-y-2">
                <AttentionRow tone="rose" icon={AlertOctagon} label="3 auths expired" cta="Review" />
                <AttentionRow tone="amber" icon={AlertTriangle} label="7 expire in 30 days" cta="Renew" />
                <AttentionRow tone="amber" icon={UserMinus} label="8 on bench" cta="Assign" />
                <AttentionRow tone="emerald" icon={Sparkles} label="4 new this week" cta="Welcome" />
              </div>
            </FeatureCard>

            <FeatureCard tone="indigo" icon={PieChart} title="Live Analytics" body="Real-time KPIs derived live from your data, charted with native SVG.">
              <div className="mt-3 flex items-center justify-center">
                <MiniDonut />
              </div>
            </FeatureCard>

            <FeatureCard tone="amber" icon={Shield} title="Compliance" body="Work auth expiry buckets at a glance — Expired through 90+ days.">
              <div className="mt-3"><MiniBars /></div>
            </FeatureCard>

            <FeatureCard className="sm:col-span-2" tone="lime" icon={Users} title="Multi-class workforce" body="One platform for every employment relationship — each class has its own fields, payroll quirks, and compliance.">
              <div className="mt-3 flex flex-wrap gap-2">
                <ClassChip label="W-2" hex="#3b82f6" />
                <ClassChip label="Contract" hex="#a855f7" />
                <ClassChip label="1099" hex="#14b8a6" />
                <ClassChip label="Offshore" hex="#ec4899" />
              </div>
            </FeatureCard>

            <FeatureCard tone="emerald" icon={TrendingUp} title="Hiring trend" body="Last 24 weeks, charted live with trend deltas.">
              <div className="mt-3"><MiniSparkline /></div>
            </FeatureCard>

            <FeatureCard tone="sky" icon={Building2} title="Client + vendor chains" body="Including end-client &amp; end-vendor for staffing chains.">
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-600">
                <ChainNode label="VEN" />
                <ChainArrow />
                <ChainNode label="CLI" />
                <ChainArrow />
                <ChainNode label="END" />
              </div>
            </FeatureCard>

            <FeatureCard className="sm:col-span-2" tone="purple" icon={UserPlus} title="Onboarding wizard" body="Step-by-step intake with drafts that survive refreshes, branched by employment class, with bulk client / vendor assignments.">
              <div className="mt-3 flex items-center gap-3">
                <StepPill n={1} label="Type" active />
                <StepLine />
                <StepPill n={2} label="Details" active />
                <StepLine />
                <StepPill n={3} label="Review" />
              </div>
            </FeatureCard>

            <FeatureCard tone="pink" icon={Cake} title="Milestones" body="Birthdays + work anniversaries, clickable to see who.">
              <div className="mt-3 flex -space-x-2">
                {['S', 'J', 'M', 'A', 'R'].map((c, i) => (
                  <span key={i} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-pink-100 text-[10px] font-bold text-pink-700">
                    {c}
                  </span>
                ))}
              </div>
            </FeatureCard>

            <FeatureCard tone="slate" icon={FileText} title="Reports &amp; export" body="Filtered CSV / PDF / JSON exports, on demand.">
              <div className="mt-3 flex gap-2">
                <ExportPill label="CSV" />
                <ExportPill label="PDF" />
                <ExportPill label="JSON" />
              </div>
            </FeatureCard>
          </div>
        </div>
      </section>

      {/* ────────────── LIVE PREVIEW (tabbed) ────────────── */}
      <section id="preview" className="border-t border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
          <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
            <SectionHeader
              eyebrow="Live preview"
              title={<>Click through the<br className="hidden sm:inline" /> actual product.</>}
            />
            <div className="inline-flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
              {([
                { id: 'operations', label: 'Operations', icon: Activity },
                { id: 'analytics',  label: 'Analytics',  icon: PieChart },
                { id: 'onboard',    label: 'Onboard',    icon: UserPlus },
              ] as const).map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors sm:px-3 sm:text-sm',
                      activeTab === t.id ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              <span className="ml-3 truncate text-[11px] text-slate-400" style={{ fontFamily: 'var(--font-jb-mono), ui-monospace, monospace' }}>
                zenhr.app/dashboard/{activeTab}
              </span>
              <span className="ml-auto hidden items-center gap-1.5 text-[10px] font-medium text-slate-400 sm:inline-flex">
                <LiveDot tone="emerald" /> Connected
              </span>
            </div>
            {/* Body */}
            <div className="p-4 sm:p-6 lg:p-8">
              {activeTab === 'operations' && <PreviewOperations />}
              {activeTab === 'analytics' && <PreviewAnalytics />}
              {activeTab === 'onboard' && <PreviewOnboard />}
            </div>
          </div>
        </div>
      </section>

      {/* ────────────── EMPLOYEE CLASSES ────────────── */}
      <section id="classes" className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
          <SectionHeader
            eyebrow="Four classes, one mental model"
            title={<>Every employment<br className="hidden sm:inline" /> relationship handled.</>}
            subtitle="The wizard branches into the right fields. Reports filter by class. KPIs are computed per class."
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ClassCard
              hex="#3b82f6"
              accentBg="bg-blue-50"
              accentText="text-blue-700"
              accentRing="ring-blue-200"
              label="W-2"
              title="Full-time staff"
              icon={Briefcase}
              fields={['Office email', 'Work authorization', 'Medical, 401(k)', 'Salary type / pay', 'Revenue: B / NB']}
            />
            <ClassCard
              hex="#a855f7"
              accentBg="bg-purple-50"
              accentText="text-purple-700"
              accentRing="ring-purple-200"
              label="Contract"
              title="Contract workers"
              icon={FileText}
              fields={['Contractor name', 'Work authorization', 'Subcontractor status', 'Revenue tracking', 'Auth expiry alerts']}
            />
            <ClassCard
              hex="#14b8a6"
              accentBg="bg-teal-50"
              accentText="text-teal-700"
              accentRing="ring-teal-200"
              label="1099"
              title="Independent contractors"
              icon={FileText}
              fields={['Office email', 'Work authorization', 'Hourly / annual pay', 'Subcontractor status', 'Rehire tracking']}
            />
            <ClassCard
              hex="#ec4899"
              accentBg="bg-pink-50"
              accentText="text-pink-700"
              accentRing="ring-pink-200"
              label="Offshore"
              title="International remote"
              icon={Globe}
              fields={['Vonage number', 'Aadhar / PAN', 'PF number (optional)', 'LLP or Pvt Ltd', 'Medical reimbursement']}
            />
          </div>
        </div>
      </section>

      {/* ────────────── WORKFLOW STEPS ────────────── */}
      <section id="workflow" className="border-t border-slate-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
          <SectionHeader
            eyebrow="How it works"
            title={<>From new face to fully<br className="hidden sm:inline" /> billable, in four moves.</>}
          />
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <WorkflowStep n="01" title="Onboard" body="Pick a class. The form branches into the right fields. Drafts auto-save through refresh." icon={Sparkles} tone="indigo" />
            <WorkflowStep n="02" title="Assign" body="Hook them up to clients, vendors — including end-client and end-vendor chains." icon={Building2} tone="emerald" />
            <WorkflowStep n="03" title="Monitor" body="Live KPIs, compliance buckets, attention rows. Click any number, see the people." icon={Activity} tone="purple" />
            <WorkflowStep n="04" title="Report" body="Filtered CSV / PDF / JSON exports. Print-style reports for any client or vendor." icon={BarChart3} tone="amber" />
          </ol>
        </div>
      </section>

      {/* ────────────── CTA ────────────── */}
      <section className="border-t border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
          <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-8 shadow-sm sm:p-12 lg:p-16">
            {/* Corner color blocks (solid, no gradients) */}
            <div className="absolute right-6 top-6 hidden flex-col gap-1.5 sm:flex">
              <span className="h-2.5 w-2.5 rounded-sm bg-indigo-500" />
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
              <span className="h-2.5 w-2.5 rounded-sm bg-amber-500" />
              <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
            </div>

            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
              <LiveDot tone="emerald" /> Ready when you are
            </span>
            <h2
              className="mt-4 max-w-3xl text-3xl font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-4xl lg:text-6xl"
              style={{ fontFamily: 'var(--font-funnel), var(--font-geist-sans), system-ui, sans-serif', letterSpacing: '-0.02em' }}
            >
              Stop chasing<br className="hidden sm:inline" /> spreadsheets.
            </h2>
            <p className="mt-4 max-w-md text-base text-slate-600">
              Open the dashboard, browse the data, see the alerts. No demo, no sales call.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-md active:translate-y-px"
              >
                Launch dashboard
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Request access
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────── FOOTER ────────────── */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-5 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:px-8 lg:px-12">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600">
              <Layers className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold tracking-tight text-slate-900">ZenHR</span>
            <span>· Workforce Operations Platform</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="inline-flex items-center gap-1.5"><LiveDot tone="emerald" /> All systems operational</span>
            <Link href="/login" className="hover:text-slate-900">Sign in</Link>
            <Link href="/signup" className="hover:text-slate-900">Request access</Link>
            <a href="#features" className="hover:text-slate-900">Features</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

// ──────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────

function SiteNav({ onOpenMobile }: { onOpenMobile: () => void }) {
  return (
    <nav className="sticky top-0 z-40 border-b border-slate-100 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 sm:h-16 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600">
            <Layers className="h-4 w-4 text-white" />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-slate-900">ZenHR</span>
          <span className="hidden items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium tracking-wide text-emerald-700 sm:inline-flex">
            <LiveDot tone="emerald" /> Operational
          </span>
        </Link>

        <div className="hidden items-center gap-6 lg:flex">
          <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900">Features</a>
          <a href="#preview" className="text-sm font-medium text-slate-600 hover:text-slate-900">Preview</a>
          <a href="#classes" className="text-sm font-medium text-slate-600 hover:text-slate-900">Workforce</a>
          <a href="#workflow" className="text-sm font-medium text-slate-600 hover:text-slate-900">How it works</a>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 sm:inline-block">
            Sign in
          </Link>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-indigo-700">
            Open dashboard
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button onClick={onOpenMobile} className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 lg:hidden" aria-label="Open menu">
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}

function LiveDot({ tone = 'emerald' }: { tone?: 'emerald' | 'indigo' | 'amber' | 'rose' }) {
  const color = tone === 'indigo' ? 'bg-indigo-500' : tone === 'amber' ? 'bg-amber-500' : tone === 'rose' ? 'bg-rose-500' : 'bg-emerald-500';
  return (
    <span className="relative inline-flex h-1.5 w-1.5">
      <span className={cn('absolute inset-0 animate-ping rounded-full opacity-60', color)} />
      <span className={cn('relative inline-block h-1.5 w-1.5 rounded-full', color)} />
    </span>
  );
}

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: React.ReactNode; subtitle?: string }) {
  return (
    <header>
      <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-600">
        <span className="h-px w-8 bg-indigo-300" /> {eyebrow}
      </span>
      <h2
        className="mt-3 text-3xl font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-4xl lg:text-5xl"
        style={{ fontFamily: 'var(--font-funnel), var(--font-geist-sans), system-ui, sans-serif', letterSpacing: '-0.02em' }}
      >
        {title}
      </h2>
      {subtitle && <p className="mt-3 max-w-xl text-[15px] text-slate-600">{subtitle}</p>}
    </header>
  );
}

// ──────── Hero dashboard mock ────────
function HeroDashboardMock() {
  return (
    <div className="relative">
      {/* corner registration marks */}
      <span className="absolute -left-2 -top-2 h-3 w-3 border-l-2 border-t-2 border-indigo-400" aria-hidden />
      <span className="absolute -right-2 -top-2 h-3 w-3 border-r-2 border-t-2 border-indigo-400" aria-hidden />
      <span className="absolute -bottom-2 -left-2 h-3 w-3 border-b-2 border-l-2 border-indigo-400" aria-hidden />
      <span className="absolute -bottom-2 -right-2 h-3 w-3 border-b-2 border-r-2 border-indigo-400" aria-hidden />

      <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-md sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Workforce Brief</p>
            <p className="mt-0.5 text-sm font-bold text-slate-900">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            <LiveDot tone="emerald" /> Live
          </span>
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2 border-y border-slate-100 py-4">
          <MockNumeral label="Active"  value="195" />
          <MockNumeral label="Revenue" value="$1.2M" tone="emerald" />
          <MockNumeral label="Util"    value="67%" tone="indigo" />
          <MockNumeral label="Expire"  value="07" tone="amber" />
        </div>

        <div className="mt-4 space-y-2">
          <AttentionRow tone="rose"    icon={AlertOctagon}  label="3 auths expired"      cta="Review" />
          <AttentionRow tone="amber"   icon={AlertTriangle} label="7 expire in 30 days" cta="Renew" />
          <AttentionRow tone="emerald" icon={Sparkles}      label="4 new this week"     cta="Welcome" />
        </div>

        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-slate-400">By class</span>
            <span className="font-bold tabular-nums text-slate-900">195</span>
          </div>
          <ul className="mt-2 space-y-1.5">
            <MockBar label="W-2"      value={124} max={124} hex="#3b82f6" />
            <MockBar label="Contract" value={38}  max={124} hex="#a855f7" />
            <MockBar label="1099"     value={12}  max={124} hex="#14b8a6" />
            <MockBar label="Offshore" value={21}  max={124} hex="#ec4899" />
          </ul>
        </div>
      </div>
    </div>
  );
}

function MockNumeral({ label, value, tone }: { label: string; value: string; tone?: 'emerald' | 'indigo' | 'amber' }) {
  const color = tone === 'emerald' ? 'text-emerald-700' : tone === 'indigo' ? 'text-indigo-700' : tone === 'amber' ? 'text-amber-700' : 'text-slate-900';
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className={cn('mt-0.5 text-base font-bold tabular-nums', color)}>{value}</p>
    </div>
  );
}

function MockBar({ label, value, max, hex }: { label: string; value: number; max: number; hex: string }) {
  return (
    <li className="flex items-center gap-2 text-[11px]">
      <span className="w-16 text-slate-500">{label}</span>
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full" style={{ width: `${(value / max) * 100}%`, backgroundColor: hex }} />
      </div>
      <span className="w-7 text-right font-bold tabular-nums text-slate-900">{value}</span>
    </li>
  );
}

// ──────── Stats ────────
function StatsSection() {
  const { ref, seen } = useInView<HTMLDivElement>(0.25);
  const employees = useCountUp(195, seen);
  const revenue = useCountUp(1.2, seen, 1500);
  const utilization = useCountUp(67, seen, 1400);
  const clients = useCountUp(42, seen, 1100);

  return (
    <section ref={ref} className="border-b border-slate-100 bg-white">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-14 lg:px-12">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile icon={Users} label="Active employees" value={`${Math.round(employees)}`} tone="indigo" />
          <StatTile icon={TrendingUp} label="Monthly run-rate" value={`$${revenue.toFixed(1)}M`} tone="emerald" />
          <StatTile icon={UserCheck} label="Utilization" value={`${Math.round(utilization)}%`} tone="purple" />
          <StatTile icon={Building2} label="Active clients" value={`${Math.round(clients)}`} tone="amber" />
        </div>
      </div>
    </section>
  );
}

const TONE_COLORS: Record<string, { iconBg: string; iconText: string; value: string }> = {
  indigo:  { iconBg: 'bg-indigo-100',  iconText: 'text-indigo-600',  value: 'text-slate-900' },
  emerald: { iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', value: 'text-slate-900' },
  purple:  { iconBg: 'bg-purple-100',  iconText: 'text-purple-600',  value: 'text-slate-900' },
  amber:   { iconBg: 'bg-amber-100',   iconText: 'text-amber-600',   value: 'text-slate-900' },
  rose:    { iconBg: 'bg-rose-100',    iconText: 'text-rose-600',    value: 'text-slate-900' },
  sky:     { iconBg: 'bg-sky-100',     iconText: 'text-sky-600',     value: 'text-slate-900' },
  pink:    { iconBg: 'bg-pink-100',    iconText: 'text-pink-600',    value: 'text-slate-900' },
  lime:    { iconBg: 'bg-lime-100',    iconText: 'text-lime-700',    value: 'text-slate-900' },
  slate:   { iconBg: 'bg-slate-100',   iconText: 'text-slate-600',   value: 'text-slate-900' },
};

function StatTile({ icon: Icon, label, value, tone }: { icon: React.ElementType; label: string; value: string; tone: keyof typeof TONE_COLORS }) {
  const t = TONE_COLORS[tone];
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl sm:h-10 sm:w-10', t.iconBg)}>
          <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', t.iconText)} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 sm:text-[11px]">{label}</span>
      </div>
      <p className={cn('mt-3 font-bold tabular-nums', t.value)} style={{ fontFamily: 'var(--font-funnel), var(--font-geist-sans), system-ui, sans-serif', fontSize: 'clamp(1.625rem, 3.5vw, 2.5rem)', letterSpacing: '-0.02em', lineHeight: 1 }}>
        {value}
      </p>
    </div>
  );
}

// ──────── Feature card (bento) ────────
function FeatureCard({
  className, tone, icon: Icon, title, body, children,
}: {
  className?: string;
  tone: keyof typeof TONE_COLORS;
  icon: React.ElementType;
  title: React.ReactNode;
  body: React.ReactNode;
  children?: React.ReactNode;
}) {
  const t = TONE_COLORS[tone];
  return (
    <article className={cn('group relative flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-6', className)}>
      <div className="flex items-center gap-2.5">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', t.iconBg)}>
          <Icon className={cn('h-4 w-4', t.iconText)} />
        </div>
        <h3 className="text-sm font-bold tracking-tight text-slate-900 sm:text-base">{title}</h3>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-slate-600 sm:text-sm">{body}</p>
      {children}
    </article>
  );
}

// ──────── Attention row (matches dashboard) ────────
function AttentionRow({ tone, icon: Icon, label, cta }: { tone: 'rose' | 'amber' | 'emerald' | 'sky'; icon: React.ElementType; label: string; cta: string }) {
  const map: Record<string, { dot: string; iconBg: string; iconText: string; ctaText: string; ctaBg: string }> = {
    rose:    { dot: 'bg-rose-500',    iconBg: 'bg-rose-50',    iconText: 'text-rose-600',    ctaText: 'text-rose-700',    ctaBg: 'bg-rose-50 ring-rose-200' },
    amber:   { dot: 'bg-amber-500',   iconBg: 'bg-amber-50',   iconText: 'text-amber-600',   ctaText: 'text-amber-700',   ctaBg: 'bg-amber-50 ring-amber-200' },
    emerald: { dot: 'bg-emerald-500', iconBg: 'bg-emerald-50', iconText: 'text-emerald-600', ctaText: 'text-emerald-700', ctaBg: 'bg-emerald-50 ring-emerald-200' },
    sky:     { dot: 'bg-sky-500',     iconBg: 'bg-sky-50',     iconText: 'text-sky-600',     ctaText: 'text-sky-700',     ctaBg: 'bg-sky-50 ring-sky-200' },
  };
  const s = map[tone];
  return (
    <div className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-white px-2.5 py-2">
      <span className={cn('h-1.5 w-1.5 flex-shrink-0 rounded-full', s.dot)} />
      <div className={cn('flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md', s.iconBg)}>
        <Icon className={cn('h-3 w-3', s.iconText)} />
      </div>
      <span className="flex-1 text-[12px] font-medium text-slate-700">{label}</span>
      <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1', s.ctaBg, s.ctaText)}>{cta}</span>
    </div>
  );
}

function MiniDonut() {
  const segs = [
    { value: 124, color: '#3b82f6' },
    { value: 38,  color: '#a855f7' },
    { value: 21,  color: '#ec4899' },
    { value: 12,  color: '#14b8a6' },
  ];
  const total = segs.reduce((s, x) => s + x.value, 0);
  const r = 28, c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="flex items-center gap-3">
      <svg width={80} height={80} viewBox="0 0 80 80" className="-rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#e2e8f0" strokeWidth={10} />
        {segs.map((seg, i) => {
          const len = (seg.value / total) * c;
          const off = -acc;
          acc += len;
          return <circle key={i} cx="40" cy="40" r={r} fill="none" stroke={seg.color} strokeWidth={10} strokeDasharray={`${len} ${c}`} strokeDashoffset={off} />;
        })}
      </svg>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Class mix</p>
        <p className="mt-0.5 text-xl font-bold tabular-nums text-slate-900">{total}</p>
      </div>
    </div>
  );
}

function MiniBars() {
  const data = [
    { label: 'Exp',  value: 3,  color: '#ef4444' },
    { label: '30',  value: 7,  color: '#f59e0b' },
    { label: '60',  value: 4,  color: '#eab308' },
    { label: '90',  value: 8,  color: '#0ea5e9' },
    { label: '90+', value: 12, color: '#94a3b8' },
  ];
  const max = Math.max(...data.map((d) => d.value));
  return (
    <div className="flex h-16 items-end gap-1.5">
      {data.map((d) => (
        <div key={d.label} className="group flex flex-1 flex-col items-center gap-1">
          <div className="w-full rounded-t" style={{ height: `${(d.value / max) * 100}%`, backgroundColor: d.color, minHeight: 6 }} title={`${d.label}: ${d.value}`} />
          <span className="text-[9px] font-medium uppercase tracking-wider text-slate-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function MiniSparkline() {
  const data = [2, 3, 1, 4, 5, 3, 6, 4, 7, 5, 8, 6, 9, 7, 10, 8, 6, 9, 11, 8, 12, 10, 13, 11];
  const max = Math.max(...data);
  const w = 240, h = 56, pad = 4;
  const step = (w - pad * 2) / (data.length - 1);
  const pts = data.map((v, i) => [pad + i * step, h - pad - (v / max) * (h - pad * 2)] as const);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" height={56}>
      <path d={line} fill="none" stroke="#10b981" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => i % 4 === 0 && <circle key={i} cx={x} cy={y} r={1.75} fill="#10b981" />)}
    </svg>
  );
}

function ClassChip({ label, hex }: { label: string; hex: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-100 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: hex }} />
      {label}
    </span>
  );
}

function ChainNode({ label }: { label: string }) {
  return <span className="rounded border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold text-sky-700">{label}</span>;
}
function ChainArrow() {
  return <span className="text-slate-300">→</span>;
}

function StepPill({ n, label, active }: { n: number; label: string; active?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn(
        'flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold',
        active ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-400'
      )}>{n}</span>
      <span className={cn('text-[11px] font-medium', active ? 'text-slate-700' : 'text-slate-400')}>{label}</span>
    </div>
  );
}
function StepLine() {
  return <span className="h-px w-4 bg-slate-200" />;
}

function ExportPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-slate-100 bg-slate-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
      <FileText className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}

// ──────── Tab preview content ────────
function PreviewOperations() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Needs your attention</p>
        <AttentionRow tone="rose"    icon={AlertOctagon}  label="3 work authorizations expired"  cta="Review" />
        <AttentionRow tone="amber"   icon={AlertTriangle} label="7 expire in the next 30 days"  cta="Renew"  />
        <AttentionRow tone="amber"   icon={UserMinus}     label="8 active staff on bench"       cta="Assign" />
        <AttentionRow tone="emerald" icon={Sparkles}      label="4 new hires this week"         cta="Welcome" />
        <div className="mt-5 grid grid-cols-3 gap-2 rounded-xl border border-slate-100 bg-white p-3 sm:gap-3 sm:p-4">
          <MockNumeral label="Active"  value="195" />
          <MockNumeral label="Revenue" value="$1.2M" tone="emerald" />
          <MockNumeral label="Util"    value="67%" tone="indigo" />
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Headcount by class</p>
        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <ul className="space-y-2">
            <MockBar label="W-2"      value={124} max={124} hex="#3b82f6" />
            <MockBar label="Contract" value={38}  max={124} hex="#a855f7" />
            <MockBar label="1099"     value={12}  max={124} hex="#14b8a6" />
            <MockBar label="Offshore" value={21}  max={124} hex="#ec4899" />
          </ul>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Upcoming birthdays</p>
          <ul className="mt-2 space-y-2">
            {[
              { name: 'Sarah Chen', date: 'May 15', avatar: 'bg-pink-100 text-pink-700' },
              { name: 'John Doe',   date: 'May 22', avatar: 'bg-blue-100 text-blue-700' },
              { name: 'Maria L.',   date: 'May 28', avatar: 'bg-emerald-100 text-emerald-700' },
            ].map((p) => (
              <li key={p.name} className="flex items-center gap-2">
                <span className={cn('flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold', p.avatar)}>{p.name.charAt(0)}</span>
                <span className="flex-1 truncate text-[12px] font-medium text-slate-700">{p.name}</span>
                <span className="text-[11px] text-slate-500">{p.date}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function PreviewAnalytics() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-xl border border-slate-100 bg-white p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Class distribution</p>
        <div className="mt-3 flex justify-center"><MiniDonut /></div>
      </div>
      <div className="rounded-xl border border-slate-100 bg-white p-4 lg:col-span-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Hires · last 24 weeks</p>
          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
            <TrendingUp className="h-2.5 w-2.5" /> 23%
          </span>
        </div>
        <div className="mt-3"><MiniSparkline /></div>
      </div>
      <div className="rounded-xl border border-slate-100 bg-white p-4 lg:col-span-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Authorization expiry buckets</p>
        <div className="mt-4"><MiniBars /></div>
      </div>
      <div className="rounded-xl border border-slate-100 bg-white p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Compliance</p>
        <div className="mt-3 space-y-2.5">
          <RingLine label="Email" pct={94} color="#6366f1" />
          <RingLine label="Phone" pct={88} color="#a855f7" />
          <RingLine label="ID"    pct={76} color="#10b981" />
        </div>
      </div>
    </div>
  );
}

function RingLine({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-12 text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="w-9 text-right text-xs font-bold tabular-nums text-slate-900">{pct}%</span>
    </div>
  );
}

function PreviewOnboard() {
  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pick a class</p>
        {[
          { label: 'W-2 Employee',   desc: 'Full-time, benefits',     hex: '#3b82f6', active: true },
          { label: 'Contract',       desc: 'Project-based',           hex: '#a855f7' },
          { label: '1099 Contractor',desc: 'Independent',             hex: '#14b8a6' },
          { label: 'Offshore',       desc: 'International remote',    hex: '#ec4899' },
        ].map((c) => (
          <div key={c.label} className={cn('flex items-center gap-3 rounded-lg border px-3 py-2.5', c.active ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-100 bg-white')}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.hex }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900">{c.label}</p>
              <p className="text-[10px] text-slate-500">{c.desc}</p>
            </div>
            {c.active && <ChevronRight className="h-3.5 w-3.5 text-indigo-600" />}
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-slate-100 bg-white p-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <StepPill n={1} label="Type" active />
          <StepLine />
          <StepPill n={2} label="Details" active />
          <StepLine />
          <StepPill n={3} label="Review" />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {['Full name', 'Position', 'Hire date', 'Work auth', 'Office email', 'Salary type'].map((f) => (
            <div key={f}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{f}</p>
              <div className="mt-1 h-8 rounded-md border border-slate-200 bg-slate-50" />
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
          <Clock className="h-3 w-3" />
          Draft auto-saved · just now
        </div>
      </div>
    </div>
  );
}

function ClassCard({
  hex, accentBg, accentText, accentRing, label, title, icon: Icon, fields,
}: {
  hex: string;
  accentBg: string;
  accentText: string;
  accentRing: string;
  label: string;
  title: string;
  icon: React.ElementType;
  fields: string[];
}) {
  return (
    <article className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-6">
      {/* Color bar on left */}
      <span className="absolute left-0 top-0 h-full w-[3px]" style={{ backgroundColor: hex }} aria-hidden />
      <div className="flex items-center justify-between gap-2">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', accentBg)}>
          <Icon className={cn('h-4 w-4', accentText)} />
        </div>
        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold ring-1', accentBg, accentText, accentRing)}>{label}</span>
      </div>
      <h3 className="text-base font-bold tracking-tight text-slate-900">{title}</h3>
      <ul className="space-y-1.5 text-[12px] text-slate-600 sm:text-sm">
        {fields.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" style={{ color: hex }} />
            {f}
          </li>
        ))}
      </ul>
    </article>
  );
}

function WorkflowStep({
  n, title, body, icon: Icon, tone,
}: { n: string; title: string; body: string; icon: React.ElementType; tone: keyof typeof TONE_COLORS }) {
  const t = TONE_COLORS[tone];
  return (
    <article className="group relative flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-3xl font-bold tabular-nums tracking-tight text-slate-200" style={{ fontFamily: 'var(--font-funnel), var(--font-geist-sans)' }}>
          {n}
        </span>
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl transition-transform group-hover:scale-110', t.iconBg)}>
          <Icon className={cn('h-4 w-4', t.iconText)} />
        </div>
      </div>
      <h3 className="text-base font-bold tracking-tight text-slate-900">{title}</h3>
      <p className="text-[13px] leading-relaxed text-slate-600 sm:text-sm">{body}</p>
    </article>
  );
}
