import Link from 'next/link';
import Image from 'next/image';
import {
  GraduationCap, Scale, Users, Target, HeartPulse, Landmark, CalendarDays,
  ArrowRight, Building2, Globe2, Rocket, ShieldCheck, Sparkles, CheckCircle2,
} from 'lucide-react';
import { BRAND } from '@/config/brand';
import { SiteNav } from '@/components/landing/SiteNav';
import { HeroActions } from '@/components/landing/HeroActions';

const CONTACT_HREF = `mailto:${BRAND.contactEmail}?subject=${encodeURIComponent(`Careers at ${BRAND.name}`)}`;

const HERO_IMG =
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1400';

/* ════════════════════════════════  Content  ════════════════════════════════ */

// A short, qualitative highlights band (no invented metrics).
const highlights = [
  { icon: Building2, label: 'Enterprise & government projects' },
  { icon: Globe2, label: 'W-2, contract, 1099 & offshore roles' },
  { icon: Rocket, label: 'Mentorship-first growth' },
  { icon: ShieldCheck, label: 'Benefits that have your back' },
];

// "Why us" — culture points (mirrors the careers page).
const culture = [
  { icon: GraduationCap, title: 'Professional growth', body: 'Training, mentorship, and cutting-edge projects that keep moving your career forward.' },
  { icon: Scale, title: 'Work-life balance', body: 'Flexible arrangements so work fits around your life, not the other way around.' },
  { icon: Users, title: 'Inclusive by design', body: 'A diverse environment where everyone is welcomed, supported, and celebrated.' },
  { icon: Target, title: 'Real impact', body: 'Work that shapes enterprise IT for real organizations and government agencies.' },
];

// What benefits we give.
const benefits = [
  { icon: HeartPulse, title: 'Health insurance', body: 'Comprehensive medical, dental, and vision coverage for you and your family.' },
  { icon: Landmark, title: 'Retirement plans', body: 'Robust 401(k) and savings options to help you build a secure financial future.' },
  { icon: CalendarDays, title: 'Paid time off', body: 'Generous vacation and sick leave so you have time to rest and recharge.' },
];

// Plain-language values used in the "Life here" block.
const values = [
  'A supportive team that celebrates wins together',
  'Clear paths for growth, backed by real mentorship',
  'Flexibility that respects your life outside work',
  'Projects that make a measurable difference',
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
      {/* Soft brand mesh + faint grid, fixed so it stays quiet on scroll */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden
        style={{
          backgroundImage:
            'radial-gradient(52% 42% at 50% -8%, rgba(29,78,216,0.08) 0%, transparent 60%), radial-gradient(40% 45% at 100% 2%, rgba(42,216,239,0.07) 0%, transparent 55%)',
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.4]"
        aria-hidden
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(15,23,42,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(70% 45% at 50% 0%, black 0%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(70% 45% at 50% 0%, black 0%, transparent 75%)',
        }}
      />

      <SiteNav />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-24 lg:pt-20">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-700 [animation-fill-mode:both]">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
              Careers at {BRAND.legalName}
            </span>
            <h1 className="mt-6 text-balance font-display text-[2.6rem] font-bold leading-[1.03] tracking-tight text-brand-900 animate-in fade-in slide-in-from-bottom-3 duration-700 [animation-delay:80ms] [animation-fill-mode:both] sm:text-[3.35rem]">
              Build your career with a team that{' '}
              <span className="bg-gradient-to-r from-brand-600 to-accent-500 bg-clip-text text-transparent">
                backs you
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-pretty text-lg leading-relaxed text-slate-600 animate-in fade-in slide-in-from-bottom-3 duration-700 [animation-delay:160ms] [animation-fill-mode:both]">
              Join the engineers, recruiters, and problem solvers shaping enterprise IT, and grow
              with a partner that invests in its people.
            </p>
            <div className="mt-9 animate-in fade-in slide-in-from-bottom-3 duration-700 [animation-delay:240ms] [animation-fill-mode:both]">
              <HeroActions />
            </div>
            <p className="mt-6 text-sm text-slate-500 animate-in fade-in duration-700 [animation-delay:360ms] [animation-fill-mode:both]">
              Already on the team? Sign in above. New here? Request access from your administrator.
            </p>
          </div>

          <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-1000 [animation-delay:200ms] [animation-fill-mode:both] lg:pl-4">
            {/* Soft glow behind the frame */}
            <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-brand-200/50 to-accent-200/40 blur-2xl" aria-hidden />
            <div className="overflow-hidden rounded-3xl border border-white/60 bg-white p-1.5 shadow-[0_30px_70px_-32px_rgba(15,23,42,0.5)] ring-1 ring-black/[0.03]">
              <div className="relative overflow-hidden rounded-[1.25rem]">
                {/* Unsplash served via plain <img> to avoid next/image remote config */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={HERO_IMG}
                  alt="The Ocean Blue team collaborating in a bright office"
                  loading="eager"
                  className="aspect-[4/3] h-full w-full object-cover"
                />
                <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand-800 shadow-sm backdrop-blur">
                  <Sparkles className="h-3.5 w-3.5 text-accent-500" strokeWidth={2} /> Life at {BRAND.name}
                </span>
              </div>
            </div>

            {/* Floating value card, modern SaaS accent */}
            <div className="absolute -bottom-5 -left-3 hidden max-w-[15rem] items-center gap-3 rounded-2xl border border-slate-100 bg-white/95 p-3.5 shadow-xl backdrop-blur sm:flex">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                <Rocket className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <p className="text-sm font-semibold leading-snug text-slate-700">Grow with mentorship and real ownership</p>
            </div>
          </div>
        </div>

        {/* Highlights band */}
        <div className="border-y border-[#e2e8f0] bg-white/70">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-4 px-5 py-6 sm:px-8 lg:grid-cols-4">
            {highlights.map((h) => (
              <div key={h.label} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                  <h.icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                </span>
                <span className="text-sm font-semibold text-slate-700">{h.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why us / culture ── */}
      <section id="culture" className="border-b border-[#e2e8f0]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Why join us</p>
            <h2 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
              A culture of growth and collaboration
            </h2>
            <p className="mt-4 text-pretty text-base leading-relaxed text-slate-600">
              We foster a supportive, inclusive environment built on continuous learning and real
              impact, so the people who build for our clients keep growing too.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {culture.map((c, i) => (
              <div
                key={c.title}
                className="surface surface-hover group flex h-full flex-col p-6 animate-in fade-in slide-in-from-bottom-3 duration-700 [animation-fill-mode:both]"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                  <c.icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 font-display text-lg font-bold text-brand-900">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section id="benefits" className="border-b border-[#e2e8f0] bg-white/60">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Benefits</p>
            <h2 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
              Benefits that have your back
            </h2>
            <p className="mt-4 text-pretty text-base leading-relaxed text-slate-600">
              Practical support for your health, your future, and your time, for you and your family.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-3">
            {benefits.map((b, i) => (
              <div
                key={b.title}
                className="surface surface-hover flex h-full flex-col p-6 sm:p-7 animate-in fade-in slide-in-from-bottom-3 duration-700 [animation-fill-mode:both]"
                style={{ animationDelay: `${i * 90}ms` }}
              >
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

      {/* ── Life here (values) ── */}
      <section className="border-b border-[#e2e8f0]">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-2 lg:gap-16">
          <div className="max-w-lg">
            <p className="eyebrow">Life at {BRAND.name}</p>
            <h2 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
              People come first, every day
            </h2>
            <p className="mt-4 text-pretty text-base leading-relaxed text-slate-600">
              We hire for potential and invest in it. From your first project onward, you get the
              mentorship, flexibility, and support to do the best work of your career.
            </p>
            <ul className="mt-7 space-y-3.5">
              {values.map((v) => (
                <li key={v} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" strokeWidth={2} />
                  <span className="text-sm font-medium leading-relaxed text-slate-700">{v}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute -inset-5 -z-10 rounded-[2rem] bg-gradient-to-br from-accent-200/40 to-brand-200/40 blur-2xl" aria-hidden />
            <div className="grid grid-cols-2 gap-4">
              {culture.map((c) => (
                <div key={c.title} className="surface flex flex-col justify-between p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                    <c.icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <p className="mt-6 font-display text-sm font-bold text-brand-900">{c.title}</p>
                </div>
              ))}
            </div>
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
            Tell us a bit about yourself and what you are looking for. We would love to hear from you.
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
