import Link from 'next/link';
import Image from 'next/image';
import {
  GraduationCap, Scale, Users, Target, HeartPulse, Landmark, CalendarDays, ArrowRight,
} from 'lucide-react';
import { BRAND } from '@/config/brand';
import { SiteNav } from '@/components/landing/SiteNav';
import { HeroActions } from '@/components/landing/HeroActions';

const CONTACT_HREF = `mailto:${BRAND.contactEmail}?subject=${encodeURIComponent(`Careers at ${BRAND.name}`)}`;

const HERO_IMG =
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1400';

/* ════════════════════════════════  Content  ════════════════════════════════ */

// "Why us" — culture points (mirrors the careers page).
const culture = [
  { icon: GraduationCap, title: 'Professional growth', body: 'Training, mentorship, and cutting-edge projects that keep moving your career forward.' },
  { icon: Scale, title: 'Work–life balance', body: 'Flexible arrangements so work fits around your life, not the other way around.' },
  { icon: Users, title: 'Inclusive by design', body: 'A diverse environment where everyone is welcomed, supported, and celebrated.' },
  { icon: Target, title: 'Real impact', body: 'Work that shapes enterprise IT for real organizations and government agencies.' },
];

// What benefits we give.
const benefits = [
  { icon: HeartPulse, title: 'Health insurance', body: 'Comprehensive medical, dental, and vision coverage for you and your family.' },
  { icon: Landmark, title: 'Retirement plans', body: 'Robust 401(k) and savings options to help you build a secure financial future.' },
  { icon: CalendarDays, title: 'Paid time off', body: 'Generous vacation and sick leave so you have time to rest and recharge.' },
];

function FooterLogo() {
  return (
    <Link href="/" className="inline-flex items-center" aria-label={`${BRAND.name} home`}>
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
            'radial-gradient(70% 55% at 100% 0%, rgba(29,78,216,0.06) 0%, transparent 50%), radial-gradient(60% 50% at 0% 4%, rgba(42,216,239,0.06) 0%, transparent 48%)',
        }}
      />

      <SiteNav />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-[#e2e8f0]">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          aria-hidden
          style={{ background: 'radial-gradient(80% 60% at 50% 0%, rgba(29,78,216,0.07) 0%, transparent 60%)' }}
        />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-20 lg:grid-cols-2 lg:gap-16">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-3 py-1 text-xs font-semibold text-brand-700 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-300" />
              Careers at {BRAND.name}
            </span>
            <h1 className="mt-6 text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight text-brand-900 sm:text-5xl">
              Build your career with our team
            </h1>
            <p className="mt-6 max-w-lg text-pretty text-lg leading-relaxed text-slate-600">
              Join the engineers, recruiters, and problem-solvers shaping enterprise IT — and grow
              with a partner that backs its people.
            </p>
            <div className="mt-8">
              <HeroActions />
            </div>
            <p className="mt-6 text-sm text-slate-500">
              Already on the team? Sign in. New here? Request access from your administrator.
            </p>
          </div>

          <div className="relative lg:pl-4">
            <div className="absolute -right-6 -top-6 -z-10 h-40 w-40 rounded-full bg-accent-100/50 blur-2xl" aria-hidden />
            <div className="overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-[0_24px_50px_-32px_rgba(15,23,42,0.4)]">
              {/* Unsplash served via plain <img> to avoid next/image remote config */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={HERO_IMG}
                alt="The Ocean Blue team collaborating in a bright office"
                loading="eager"
                className="aspect-[4/3] h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Why us / culture ── */}
      <section id="culture" className="border-b border-[#e2e8f0]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Why join us</p>
            <h2 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
              A culture of growth and collaboration
            </h2>
            <p className="mt-4 text-pretty text-base leading-relaxed text-slate-600">
              We foster a supportive, inclusive environment built on continuous learning and real
              impact — so the people who build for our clients keep growing too.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {culture.map((c) => (
              <div key={c.title} className="surface surface-hover p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                  <c.icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-brand-900">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section id="benefits" className="border-b border-[#e2e8f0] bg-white/50">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Benefits</p>
            <h2 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
              Benefits that have your back
            </h2>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {benefits.map((b) => (
              <div key={b.title} className="surface surface-hover p-7">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-50 text-accent-700 ring-1 ring-accent-100">
                  <b.icon className="h-6 w-6" strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 font-display text-xl font-bold text-brand-900">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Work with us ── */}
      <section id="join" className="relative overflow-hidden bg-brand-950 text-white">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-brand-800/40 blur-3xl" />
          <div className="absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-accent-500/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl px-5 py-20 text-center sm:px-8 sm:py-24">
          <h2 className="text-balance font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to join our team?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-white/65">
            Tell us a bit about yourself and what you’re looking for. We’d love to hear from you.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href={CONTACT_HREF} className="btn-accent group px-6 py-3 text-base">
              Get in touch
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} />
            </a>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>
          <p className="mx-auto mt-10 max-w-2xl text-xs leading-relaxed text-white/45">
            {BRAND.legalName} celebrates diversity and is committed to an inclusive environment for
            all. We do not discriminate based on race, color, religion, sex, sexual orientation,
            gender identity, national origin, disability, or veteran status.
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#f8fafc]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-10 sm:flex-row sm:px-8">
          <FooterLogo />
          <div className="flex items-center gap-6 text-sm">
            <a href="#culture" className="font-medium text-slate-600 transition-colors hover:text-brand-900">Why us</a>
            <a href="#benefits" className="font-medium text-slate-600 transition-colors hover:text-brand-900">Benefits</a>
            <a href={CONTACT_HREF} className="font-medium text-slate-600 transition-colors hover:text-brand-900">Contact</a>
            <Link href="/login" className="font-medium text-slate-600 transition-colors hover:text-brand-900">Sign in</Link>
          </div>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} {BRAND.legalName}</p>
        </div>
      </footer>
    </main>
  );
}
