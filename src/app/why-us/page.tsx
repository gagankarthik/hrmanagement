import Link from 'next/link';
import Image from 'next/image';
import {
  GraduationCap, Scale, Users, Target, HeartPulse, Landmark, CalendarDays,
  Building2, Globe2, Rocket, ShieldCheck, CheckCircle2,
} from 'lucide-react';
import { BRAND } from '@/config/brand';
import { SiteNav } from '@/components/landing/SiteNav';
import { Reveal } from '@/components/landing/Reveal';
import { Cta, Eyebrow } from '@/components/landing/ui';

export const metadata = {
  title: `Why work with us · ${BRAND.name}`,
  description: `Culture, benefits, and how work feels at ${BRAND.legalName}.`,
};

const CONTACT_HREF = `mailto:${BRAND.contactEmail}?subject=${encodeURIComponent(`Careers at ${BRAND.name}`)}`;

/* ════════════════════════════════  Content  ════════════════════════════════ */

const culture = [
  { n: '01', icon: GraduationCap, title: 'Professional growth', body: 'Training, mentorship, and cutting-edge projects that keep moving your career forward.' },
  { n: '02', icon: Scale, title: 'Work-life balance', body: 'Flexible arrangements so work fits around your life, not the other way around.' },
  { n: '03', icon: Users, title: 'Inclusive by design', body: 'A diverse environment where everyone is welcomed, supported, and celebrated.' },
  { n: '04', icon: Target, title: 'Real impact', body: 'Work that shapes enterprise IT for real organizations and government agencies.' },
];

const howWeWork = [
  { icon: Building2, title: 'Enterprise & government projects', body: 'You build for real organizations with real stakes, not throwaway prototypes.' },
  { icon: Globe2, title: 'Every way of working', body: 'W-2, contract, 1099, and offshore roles, each with a clear, honest arrangement.' },
  { icon: Rocket, title: 'Mentorship first', body: 'Someone senior is invested in your growth from your first project onward.' },
  { icon: ShieldCheck, title: 'A team that has your back', body: 'HR, compliance, and payroll handled properly, so you can focus on the work.' },
];

const benefits = [
  { icon: HeartPulse, title: 'Health insurance', body: 'Comprehensive medical, dental, and vision coverage for you and your family.' },
  { icon: Landmark, title: 'Retirement plans', body: 'Robust 401(k) and savings options to help you build a secure financial future.' },
  { icon: CalendarDays, title: 'Paid time off', body: 'Generous vacation and sick leave so you have time to rest and recharge.' },
];

const values = [
  'A supportive team that celebrates wins together',
  'Clear paths for growth, backed by real mentorship',
  'Flexibility that respects your life outside work',
  'Projects that make a measurable difference',
];

/* ════════════════════════════════  Page  ════════════════════════════════ */

export default function WhyUsPage() {
  return (
    <main id="main" className="horizon relative w-full bg-[var(--hz-canvas)]">
      <SiteNav />

      {/* ── Hero — light, typographic ── */}
      <section className="relative overflow-hidden">
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
        <div className="relative mx-auto w-full max-w-7xl px-6 pb-16 pt-28 sm:px-8 md:pt-32 lg:pb-20 lg:pt-36 2xl:max-w-[96rem]">
          <div className="max-w-2xl">
            <span className="animate-in fade-in slide-in-from-bottom-2 duration-700 [animation-fill-mode:both]">
              <Eyebrow>Working at {BRAND.legalName}</Eyebrow>
            </span>
            <h1 className="hz-display mt-6 text-[clamp(2.2rem,4.8vw,3.8rem)] text-[var(--hz-text)] animate-in fade-in slide-in-from-bottom-3 duration-700 [animation-delay:100ms] [animation-fill-mode:both]">
              Work with a team <span className="text-[var(--hz-cobalt)]">that backs you.</span>
            </h1>
            <p className="mt-6 max-w-lg text-[16px] leading-relaxed text-[var(--hz-text-mute)] animate-in fade-in slide-in-from-bottom-3 duration-700 [animation-delay:200ms] [animation-fill-mode:both] sm:text-[17px]">
              We hire for potential and invest in it. Here is what the work, the culture, and the
              benefits actually look like.
            </p>
          </div>
        </div>
      </section>

      {/* ── Culture — numbered editorial list ── */}
      <section className="relative w-full border-t border-[var(--hz-band-line)] bg-[var(--hz-band)] py-20 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 sm:px-8 lg:grid-cols-12 lg:gap-16 2xl:max-w-[96rem]">
          <Reveal className="lg:col-span-4">
            <span aria-hidden className="block h-[3px] w-12 rounded-full bg-[var(--hz-amber)]" />
            <h2 className="hz-display mt-6 text-[1.9rem] text-[var(--hz-text)] sm:text-[2.4rem]">
              A culture of growth.
            </h2>
            <p className="mt-4 max-w-sm text-[15.5px] leading-relaxed text-[var(--hz-text-mute)]">
              We foster a supportive, inclusive environment built on continuous learning and real
              impact, so the people who build for our clients keep growing too.
            </p>
          </Reveal>

          <div className="lg:col-span-8">
            {culture.map((c, i) => (
              <Reveal key={c.n} delay={i * 80}>
                <div
                  className={`grid grid-cols-[auto_auto_1fr] items-start gap-5 py-6 sm:gap-7 sm:py-7 ${
                    i > 0 ? 'border-t border-[var(--hz-band-line)]' : ''
                  }`}
                >
                  <span className="hz-eyebrow pt-1.5 text-[var(--hz-amber)]">{c.n}</span>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]" aria-hidden>
                    <c.icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0">
                    <span className="hz-display block text-[1.2rem] text-[var(--hz-text)] sm:text-[1.35rem]">{c.title}</span>
                    <span className="mt-1.5 block max-w-lg text-[14px] leading-relaxed text-[var(--hz-text-mute)]">{c.body}</span>
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How the work feels — dark bento ── */}
      <section className="relative isolate w-full overflow-hidden" style={{ background: '#07142b' }}>
        <div
          aria-hidden
          className="absolute inset-0 z-0"
          style={{
            background:
              'radial-gradient(50% 60% at 90% 0%, rgba(42,216,239,0.14), transparent 60%), radial-gradient(45% 60% at 5% 100%, rgba(29,78,216,0.35), transparent 62%)',
          }}
        />
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-20 sm:px-8 sm:py-24 2xl:max-w-[96rem]">
          <Reveal className="max-w-2xl">
            <Eyebrow tone="dark">How the work feels</Eyebrow>
            <h2 className="hz-display mt-4 text-[1.9rem] text-white sm:text-[2.4rem]">
              Real projects, real support.
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {howWeWork.map((h, i) => (
              <Reveal key={h.title} delay={i * 70}>
                <div className="flex h-full flex-col rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/10 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:bg-white/[0.07] hover:ring-white/20">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.06] text-[var(--hz-cyan-400)] ring-1 ring-white/10" aria-hidden>
                    <h.icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <h3 className="hz-display mt-5 text-[1.1rem] text-white">{h.title}</h3>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-white/60">{h.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits + values ── */}
      <section className="relative w-full bg-[var(--hz-canvas)] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 2xl:max-w-[96rem]">
          <Reveal className="max-w-2xl">
            <Eyebrow>Benefits</Eyebrow>
            <h2 className="hz-display mt-4 text-[1.9rem] text-[var(--hz-text)] sm:text-[2.4rem]">
              Benefits that have your back.
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {benefits.map((b, i) => (
              <Reveal key={b.title} delay={i * 90} className="h-full">
                <div className="flex h-full flex-col rounded-2xl border border-[var(--hz-line)] bg-white p-6 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:border-[var(--hz-cobalt-100)] hover:shadow-[var(--hz-shadow-md)] sm:p-7">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]" aria-hidden>
                    <b.icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <h3 className="hz-display mt-5 text-[1.2rem] text-[var(--hz-text)]">{b.title}</h3>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-[var(--hz-text-mute)]">{b.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-12">
            <ul className="grid gap-x-10 gap-y-3.5 sm:grid-cols-2">
              {values.map((v) => (
                <li key={v} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--hz-cobalt)]" strokeWidth={2} />
                  <span className="text-[14px] font-medium leading-relaxed text-[var(--hz-text)]">{v}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ── CTA strip ── */}
      <section className="w-full border-y border-[var(--hz-band-line)] bg-[var(--hz-band)]">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-6 py-14 sm:px-8 sm:py-16 lg:flex-row lg:items-center 2xl:max-w-[96rem]">
          <Reveal className="max-w-xl">
            <h2 className="hz-display text-[1.6rem] text-[var(--hz-text)] sm:text-[2rem]">
              Sound like your kind of team?
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--hz-text-mute)]">
              Tell us a bit about yourself and what you are looking for. We would love to hear from you.
            </p>
          </Reveal>
          <Reveal delay={120} className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Cta href={CONTACT_HREF} variant="primary" icon="mail">Get in touch</Cta>
            <Cta href="/" variant="ghostLight">Back to the portal</Cta>
          </Reveal>
        </div>
      </section>

      {/* ── Footer — same compact band as the landing ── */}
      <footer className="w-full bg-[var(--hz-canvas)]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row sm:px-8 2xl:max-w-[96rem]">
          <Link href="/" className="inline-flex" aria-label={`${BRAND.name} home`}>
            <Image src="/logo.png" alt={BRAND.name} width={170} height={40} className="h-7 w-auto" />
          </Link>
          <p className="text-[12.5px] text-[var(--hz-text-subtle)]">
            © {new Date().getFullYear()} {BRAND.legalName}. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
