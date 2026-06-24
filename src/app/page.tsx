import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users, Building2, Workflow, CalendarClock, BarChart3, UploadCloud,
  Check, Lock, FileCheck2, KeyRound, ServerCog, FileDown, Plug, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BRAND } from '@/config/brand';
import { BrandMark } from '@/components/ui/brand-mark';
import { SiteNav } from '@/components/landing/SiteNav';
import { HeroActions } from '@/components/landing/HeroActions';

const DEMO_HREF = `mailto:${BRAND.contactEmail}?subject=${encodeURIComponent(`${BRAND.name} demo`)}`;

// Curated, related workplace photography (Unsplash). Brand-tinted in <Photo/>.
const IMG = '?auto=format&fit=crop&q=80';
const photos = {
  hero: `https://images.unsplash.com/photo-1521737604893-d14cc237f11d${IMG}&w=1400`,
  records: `https://images.unsplash.com/photo-1600880292203-757bb62b4baf${IMG}&w=1200`,
  placements: `https://images.unsplash.com/photo-1551836022-d5d88e9218df${IMG}&w=1200`,
  compliance: `https://images.unsplash.com/photo-1497215728101-856f4ea42174${IMG}&w=1200`,
  onboarding: `https://images.unsplash.com/photo-1556761175-b413da4baf72${IMG}&w=1200`,
};

/** A cleanly framed photo — soft neutral shadow, no heavy tint or chrome. */
function Photo({
  src,
  alt,
  aspect = 'aspect-[4/3]',
  className,
}: {
  src: string;
  alt: string;
  aspect?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_24px_50px_-32px_rgba(15,23,42,0.35)]',
        className,
      )}
    >
      <div className={aspect}>
        <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
      </div>
    </div>
  );
}

/* ════════════════════════════════  Content  ════════════════════════════════ */

type FeatureRow = {
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
  img: string;
  alt: string;
  flip?: boolean;
};

const featureRows: FeatureRow[] = [
  {
    eyebrow: 'Unified records',
    title: 'Every worker type, one profile',
    body: 'W-2, contract, 1099, and offshore staff each carry the exact fields, pay structure, and documents their classification needs — without four different spreadsheets.',
    points: ['Classification-aware fields and pay', 'Searchable across your whole roster', 'Active, bench, and terminated at a glance'],
    img: photos.records,
    alt: 'A team reviewing staffing records together in a bright meeting room',
  },
  {
    eyebrow: 'Relationships',
    title: 'Every placement, mapped and dated',
    body: 'Link a person to the clients, vendors, and subcontractors they work through, with start and end dates on each assignment — all on one record.',
    points: ['Client, vendor & subcontractor assignments', 'Start and end dates per engagement', 'See who is placed where, instantly'],
    img: photos.placements,
    alt: 'Two colleagues discussing a placement over a laptop',
    flip: true,
  },
  {
    eyebrow: 'Compliance',
    title: 'Expirations caught before they bite',
    body: 'Work authorizations and documents surface well ahead of their deadlines, so a lapse never catches your compliance team — or your client — off guard.',
    points: ['Visa & work-authorization tracking', 'Lead-time alerts, not last-minute scrambles', 'Audit-ready document history'],
    img: photos.compliance,
    alt: 'A focused professional reviewing compliance documents at a desk',
  },
  {
    eyebrow: 'Onboarding at scale',
    title: 'Bring on a whole roster in minutes',
    body: 'Import hundreds of people, clients, or vendors straight from a spreadsheet. Every row is validated before anything is saved, with clear errors you can fix in place.',
    points: ['Upload Excel/CSV or paste from a sheet', 'Row-by-row validation with reasons', 'Downloadable templates for every entity'],
    img: photos.onboarding,
    alt: 'A person working through a spreadsheet of new hires on a laptop',
    flip: true,
  },
];

const modules = [
  { icon: Users, label: 'People' },
  { icon: Building2, label: 'Clients' },
  { icon: Workflow, label: 'Vendors' },
  { icon: Building2, label: 'Subcontractors' },
  { icon: CalendarClock, label: 'Compliance' },
  { icon: BarChart3, label: 'Reporting' },
];

const industries = ['IT & engineering staffing', 'Healthcare staffing', 'Consulting & SI', 'Managed services (MSP)', 'Light industrial'];

const whyUs = [
  { icon: Building2, title: 'One accountable partner', body: 'IT staffing, enterprise solutions, and managed services under a single point of accountability — no finger-pointing across vendors.' },
  { icon: Users, title: 'Talent that fits, fast', body: 'Vetted W-2, contract, 1099, and offshore professionals matched to your roles and ramped without the usual hiring lag.' },
  { icon: ServerCog, title: 'Enterprise & government ready', body: 'Proven delivering for large enterprises and government agencies, with the process and rigor those engagements demand.' },
  { icon: Lock, title: 'Security & compliance first', body: 'Work authorization, COI, and document compliance tracked end to end — encrypted, role-scoped, and audit-ready.' },
  { icon: BarChart3, title: 'Visibility you can act on', body: 'Real-time dashboards on headcount, utilization, margins, and compliance — the whole engagement at a glance.' },
  { icon: CalendarClock, title: 'Built to scale with you', body: 'From a single placement to a multi-client bench, the same clean system grows without the rework.' },
];

const faqs = [
  { q: 'Which worker types does it support?', a: 'W-2, contract, 1099, and offshore — each with the fields, pay structure, and documents its classification actually needs.' },
  { q: 'Can I bring my existing data in?', a: 'Yes. Import people, clients, and vendors from Excel or CSV — or paste straight from a sheet. Every row is validated before it is saved.' },
  { q: 'How does it handle compliance?', a: 'Work authorizations and documents are tracked with lead-time alerts, so expirations surface long before they lapse, with an audit-ready history.' },
  { q: 'Is my data secure?', a: 'Data is encrypted in transit and at rest, access is scoped by role, and your records stay in infrastructure you control — never brokered to third parties.' },
  { q: 'Can I export for audits and reporting?', a: 'Headcount, utilization, and billable mix export to CSV and PDF in a click — ready for stakeholders and client audits.' },
  { q: 'How long does setup take?', a: 'Most teams onboard people and map relationships in a day, and import an existing roster in minutes.' },
];

const trustPoints = [
  { icon: Lock, title: 'Encrypted end to end', body: 'Data is encrypted in transit and at rest. Credentials never reach the browser.' },
  { icon: KeyRound, title: 'Role-ready access', body: 'Access is scoped to who should see what, with audit-friendly records throughout.' },
  { icon: ServerCog, title: 'Your data stays yours', body: 'Records live in infrastructure you control — no third-party data brokering, ever.' },
  { icon: FileCheck2, title: 'Built for audits', body: 'Clean, exportable histories make compliance reviews and client audits painless.' },
];

function FooterLogo() {
  return (
    <Link
      href="/"
      className="inline-flex items-center rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-white/10 transition-transform hover:-translate-y-0.5"
      aria-label={`${BRAND.name} home`}
    >
      <Image src="/logo.png" alt={BRAND.name} width={277} height={76} className="h-8 w-auto" />
    </Link>
  );
}

/* ════════════════════════════════  Page  ════════════════════════════════ */

export default function LandingPage() {
  return (
    <main id="main" className="relative min-h-screen bg-[#f8fafc] text-[#0f172a]">
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden
        style={{
          backgroundImage:
            'radial-gradient(70% 55% at 100% 0%, rgba(29,78,216,0.06) 0%, transparent 50%), radial-gradient(60% 50% at 0% 4%, rgba(42,216,239,0.07) 0%, transparent 48%)',
        }}
      />

      <SiteNav />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-[#e2e8f0]">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          aria-hidden
          style={{ background: 'radial-gradient(78% 60% at 88% 0%, rgba(29,78,216,0.07) 0%, transparent 55%)' }}
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-14 sm:px-8 sm:pb-24 sm:pt-20 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-3 py-1 text-xs font-semibold text-brand-700 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-300" />
              IT staffing · Enterprise solutions · Managed services
            </span>
            <h1 className="mt-5 text-balance font-display text-4xl font-bold leading-[1.04] tracking-tight text-brand-900 sm:text-5xl lg:text-[3.6rem]">
              The people and platform behind your workforce
            </h1>
            <p className="mt-6 max-w-lg text-pretty text-lg leading-relaxed text-slate-600">
              {BRAND.name} is one accountable partner for enterprises and government agencies —
              bringing every W-2, contract, 1099, and offshore professional together with the
              clients, compliance, and reporting your operation runs on, in a single system.
            </p>
            <div className="mt-8">
              <HeroActions />
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-brand-600" strokeWidth={2.25} /> Enterprises &amp; government agencies
              </span>
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-brand-600" strokeWidth={2.25} /> W-2 · Contract · 1099 · Offshore
              </span>
              <span className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-brand-600" strokeWidth={2.25} /> Your data, your control
              </span>
            </div>
          </div>

          <div className="relative lg:pl-4">
            <Photo src={photos.hero} alt="A staffing team collaborating around a table in a bright workspace" aspect="aspect-[5/4]" />
            {/* frosted caption — text over photo, not a UI screenshot */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-2xl border border-white/40 bg-white/75 px-4 py-3 backdrop-blur-md sm:left-5 sm:right-auto sm:max-w-xs">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-900 text-white">
                <Users className="h-4.5 w-4.5" strokeWidth={1.75} />
              </span>
              <p className="text-[13px] font-semibold leading-tight text-brand-900">
                One record for W-2, contract, 1099 &amp; offshore
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Industries strip ── */}
      <section className="border-b border-[#e2e8f0] bg-white/50">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Built for teams who run on contingent talent
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-3">
            {industries.map((name) => (
              <span key={name} className="rounded-full border border-[#e2e8f0] bg-white px-4 py-1.5 text-sm font-semibold text-brand-800">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Unified platform ── */}
      <section id="platform" className="border-b border-[#e2e8f0]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">One platform</p>
            <h2 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
              Everything connects to one worker record
            </h2>
            <p className="mt-4 text-pretty text-base leading-relaxed text-slate-600">
              People, placements, compliance, and reporting share a single source of truth — so a
              change in one place is reflected everywhere, with no re-keying between systems.
            </p>
          </div>

          <div className="mt-14 flex flex-col items-center">
            <div className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-900 px-6 py-4 text-white shadow-[0_20px_40px_-22px_rgba(29,78,216,0.7)]">
              <BrandMark size={28} variant="light" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-accent-300">Source of truth</p>
                <p className="font-display text-lg font-bold leading-tight">One worker record</p>
              </div>
            </div>
            <div className="h-8 w-px bg-gradient-to-b from-brand-300 to-transparent" aria-hidden />
            <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((m) => (
                <div key={m.label} className="surface surface-hover flex items-center gap-3 p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                    <m.icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <span className="font-display text-[15px] font-bold text-brand-900">{m.label}</span>
                  <Check className="ml-auto h-4 w-4 text-emerald-500" strokeWidth={2.25} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature rows (zig-zag, photo + text) ── */}
      <section id="features" className="border-b border-[#e2e8f0] bg-white/50">
        <div className="mx-auto max-w-6xl space-y-20 px-5 py-20 sm:px-8 sm:py-28 sm:space-y-28">
          {featureRows.map((row) => (
            <div key={row.title} className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div className={cn('relative', row.flip ? 'lg:order-2' : 'lg:order-1')}>
                <div className={cn('absolute -z-10 h-40 w-40 rounded-full blur-2xl', row.flip ? '-right-6 -top-6 bg-accent-100/50' : '-left-6 -top-6 bg-brand-200/50')} aria-hidden />
                <Photo src={row.img} alt={row.alt} />
              </div>
              <div className={cn(row.flip ? 'lg:order-1' : 'lg:order-2')}>
                <p className="eyebrow">{row.eyebrow}</p>
                <h2 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight text-brand-900 sm:text-[2.15rem]">{row.title}</h2>
                <p className="mt-4 max-w-md text-pretty text-base leading-relaxed text-slate-600">{row.body}</p>
                <ul className="mt-6 grid gap-3">
                  {row.points.map((p) => (
                    <li key={p} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-accent-50 ring-1 ring-accent-100">
                        <Check className="h-3 w-3 text-accent-700" strokeWidth={2.5} />
                      </span>
                      <span className="text-sm leading-relaxed text-slate-700">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Fits your workflow ── */}
      <section className="border-b border-[#e2e8f0]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Fits how you already work</p>
            <h2 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
              No rip-and-replace. It meets your spreadsheets where they are.
            </h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {[
              { icon: UploadCloud, title: 'Spreadsheet onboarding', body: 'Import people, clients, and vendors from Excel or CSV — or paste rows straight in.' },
              { icon: FileDown, title: 'CSV & PDF exports', body: 'Hand stakeholders and auditors a clean export of headcount, utilization, and rosters.' },
              { icon: Plug, title: 'Templates for every entity', body: 'Download a ready-made template so your team fills in exactly the right columns.' },
            ].map((c) => (
              <div key={c.title} className="surface surface-hover p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-700 ring-1 ring-accent-100">
                  <c.icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-brand-900">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why work with us ── */}
      <section id="why" className="border-b border-[#e2e8f0] bg-white/50">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-accent-700 ring-1 ring-accent-100">
              <Sparkles className="h-3 w-3" strokeWidth={2} /> Why {BRAND.name}
            </span>
            <h2 className="mt-4 text-balance font-display text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
              Why teams work with us
            </h2>
            <p className="mt-4 text-pretty text-base leading-relaxed text-slate-600">
              One accountable partner for the people and platforms behind enterprises and government
              agencies — staffing, enterprise solutions, and managed services, all run on a single
              source of truth.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {whyUs.map((c) => (
              <div key={c.title} className="surface surface-hover p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                  <c.icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-brand-900">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex justify-center">
            <a href={DEMO_HREF} className="btn-accent px-6 py-3 text-base">
              Start a conversation
            </a>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-b border-[#e2e8f0]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="eyebrow">FAQ</p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
                Questions, answered
              </h2>
              <p className="mt-4 max-w-xs text-pretty text-sm leading-relaxed text-slate-600">
                Still unsure if {BRAND.name} fits your operation?{' '}
                <a href={DEMO_HREF} className="font-semibold text-brand-700 underline-offset-2 hover:underline">Book a demo</a> and we’ll walk your scenario.
              </p>
            </div>
            <dl className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
              {faqs.map((f) => (
                <div key={f.q}>
                  <dt className="font-display text-[15px] font-bold text-brand-900">{f.q}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* ══════════  Dark closing block: CTA + security + footer  ══════════ */}
      <section id="trust" className="relative overflow-hidden bg-brand-950 text-white grain">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-brand-800/40 blur-3xl" />
          <div className="absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-accent-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="max-w-2xl">
            <h2 className="text-balance font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Put {BRAND.name} behind your workforce
            </h2>
            <p className="mt-4 max-w-lg text-pretty text-base leading-relaxed text-white/65">
              Sign in to manage your people, clients, vendors, and compliance in one place — or start
              a conversation about staffing, enterprise solutions, and managed services.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <HeroActions />
              <a href={DEMO_HREF} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10">
                Start a conversation
              </a>
            </div>
          </div>

          <div className="mt-16 border-t border-white/10 pt-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent-300">Security &amp; compliance</p>
            <h3 className="mt-3 max-w-xl font-display text-2xl font-bold sm:text-3xl">Trustworthy by design, not by promise</h3>
            <div className="mt-10 grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
              {trustPoints.map((t) => (
                <div key={t.title}>
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.07] text-accent-300 ring-1 ring-white/10">
                    <t.icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <h4 className="mt-4 text-[15px] font-bold">{t.title}</h4>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/60">{t.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <footer className="relative border-t border-white/10 bg-brand-950">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <FooterLogo />
                <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">
                  {BRAND.shortDescription} W-2, contract, 1099, and offshore staff, with clients,
                  vendors, subcontractors, and compliance on one record.
                </p>
              </div>

              <nav aria-label="Product" className="lg:col-span-3 lg:col-start-7">
                <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">Product</h4>
                <ul className="mt-4 space-y-3">
                  <li><a href="#platform" className="text-sm text-white/70 transition-colors hover:text-white">Platform</a></li>
                  <li><a href="#features" className="text-sm text-white/70 transition-colors hover:text-white">Capabilities</a></li>
                  <li><a href="#why" className="text-sm text-white/70 transition-colors hover:text-white">Why us</a></li>
                  <li><a href="#trust" className="text-sm text-white/70 transition-colors hover:text-white">Security</a></li>
                </ul>
              </nav>

              <nav aria-label="Account" className="lg:col-span-2">
                <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">Account</h4>
                <ul className="mt-4 space-y-3">
                  <li><Link href="/login" className="text-sm text-white/70 transition-colors hover:text-white">Log in</Link></li>
                  <li><Link href="/signup" className="text-sm text-white/70 transition-colors hover:text-white">Get started</Link></li>
                  <li><a href={DEMO_HREF} className="text-sm text-white/70 transition-colors hover:text-white">Book a demo</a></li>
                  <li><Link href="/dashboard" className="text-sm text-white/70 transition-colors hover:text-white">Dashboard</Link></li>
                </ul>
              </nav>
            </div>

            <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
              <p className="text-xs text-white/50">© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
              <div className="flex items-center gap-5">
                <a href="#" className="text-xs text-white/50 transition-colors hover:text-white/80">Privacy</a>
                <a href="#" className="text-xs text-white/50 transition-colors hover:text-white/80">Terms</a>
                <a href={`mailto:${BRAND.contactEmail}`} className="text-xs text-white/50 transition-colors hover:text-white/80">Contact</a>
              </div>
            </div>
          </div>
        </footer>
      </section>
    </main>
  );
}
