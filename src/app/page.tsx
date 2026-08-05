import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowUpRight, Plus, CalendarDays, ShieldCheck, Building2, Globe2, GraduationCap,
  HeartPulse, Landmark, Umbrella, Scale, Users,
} from 'lucide-react';
import type { Metadata } from 'next';
import { BRAND, SITE_URL } from '@/config/brand';
import { PHOTOS } from '@/config/photos';
import { SiteNav } from '@/components/landing/SiteNav';
import { SiteFooter } from '@/components/landing/SiteFooter';
import { Hero } from '@/components/landing/Hero';
import { Reveal } from '@/components/landing/Reveal';
import { Cta, Eyebrow } from '@/components/landing/ui';

export const metadata: Metadata = {
  // Absolute so the brand leads the tab and the search result.
  title: { absolute: `${BRAND.legalName} | IT services and staffing` },
  description:
    `${BRAND.legalName} is an IT services and staffing company delivering enterprise and government projects with W-2, contract, 1099 and offshore teams. See how we work, what we pay and how to join.`,
  alternates: { canonical: '/' },
  openGraph: {
    title: `${BRAND.legalName} | IT services and staffing`,
    description: `Enterprise and government IT delivery, staffed by people we back. Culture, benefits and how to join ${BRAND.legalName}.`,
    url: '/',
  },
};

const CONTACT_HREF = `mailto:${BRAND.contactEmail}?subject=${encodeURIComponent(`${BRAND.name} enquiry`)}`;

/* ════════════════════════════════  Content  ════════════════════════════════ */

/** What the company actually does, in three plain statements. */
const whatWeDo = [
  {
    icon: Building2,
    title: 'Enterprise and government delivery',
    body: 'Teams building for organizations and agencies where the system has to work on Monday, not eventually.',
  },
  {
    icon: Globe2,
    title: 'Onshore and offshore, one standard',
    body: 'People in the US and abroad on the same projects, held to the same bar and supported the same way.',
  },
  {
    icon: Users,
    title: 'Staffing that stays involved',
    body: 'We place people and then stay in it: check-ins, paperwork handled, and someone to call.',
  },
];

/** How we work day to day. Principles, each with the practice that proves it. */
const culture = [
  {
    icon: GraduationCap,
    title: 'Growth is someone’s job',
    body: 'Someone senior is invested in your progress from the first project. Mentorship is assigned, not hoped for.',
  },
  {
    icon: Scale,
    title: 'Work fits around a life',
    body: 'Flexible arrangements, remote days, and time off you are expected to actually take.',
  },
  {
    icon: Users,
    title: 'Inclusive by design',
    body: 'A team drawn from everywhere, where the newest voice in the room still gets heard.',
  },
  {
    icon: ShieldCheck,
    title: 'The back office has your back',
    body: 'Payroll, immigration paperwork, and compliance handled properly, so you can keep your head in the work.',
  },
];

/** Benefits, named the way they appear in enrollment. */
const benefits = [
  { icon: HeartPulse, title: 'Health', body: 'Medical, dental and vision cover for you and your family.' },
  { icon: Landmark, title: 'Retirement', body: '401(k) with an employer contribution, enrolled from your portal.' },
  { icon: Umbrella, title: 'Protection', body: 'Life and disability cover, in place from day one.' },
  { icon: CalendarDays, title: 'Time off', body: 'PTO, sick and casual leave, plus long leave when life needs it.' },
];


/**
 * The questions people actually arrive with. Doubles as FAQ structured data,
 * so the answers have to stay true to how the company works.
 */
const faqs = [
  {
    q: `What does ${BRAND.legalName} do?`,
    a: `We are an IT services and staffing company. We build and support enterprise and government systems, and we staff those projects with our own consultants across W-2, contract, 1099 and offshore arrangements.`,
  },
  {
    q: 'What kinds of roles do you hire for?',
    a: 'Application development, data engineering, systems integration, quality engineering, and the support and delivery roles around them. Engagements run from short project work to multi-year programs.',
  },
  {
    q: 'What is the difference between your W-2, contract, 1099 and offshore arrangements?',
    a: 'W-2 means salaried on our payroll with the full benefits package and 401(k). Contract is project work on a defined engagement with clear terms. 1099 covers independent consultants contracted directly. Offshore covers our teams outside the US, employed through local payroll entities.',
  },
  {
    q: 'Do you sponsor or support work authorization?',
    a: 'We handle employment eligibility properly, including Form I-9 verification and, where it applies, STEM OPT training plans. Work authorization records and expiry dates are tracked so nothing lapses by surprise. What we can sponsor depends on the role, so ask HR about a specific opening.',
  },
  {
    q: 'What benefits do you offer?',
    a: 'Medical, dental and vision cover, a 401(k) with an employer contribution, life and disability cover, and paid time off including sick, casual and long leave. Cover varies by arrangement, and your enrollment is visible in your portal.',
  },
  {
    q: 'How do I get access to the employee portal?',
    a: 'Accounts are created by HR or an administrator. There is no public sign-up. You will get an emailed invite and set your own password. This portal keeps its own sign-in, separate from the company website.',
  },
];

/* ════════════════════════════════  Page  ════════════════════════════════ */

export default function LandingPage() {
  return (
    <main id="main" className="horizon relative w-full bg-[var(--hz-canvas)]">
      <SiteNav />

      <Hero />

      {/* ── What we do. Text scrolls, the photographs hold their place. ── */}
      <section id="company" className="relative w-full scroll-mt-24 bg-[var(--hz-canvas)] py-20 sm:py-24 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 sm:px-8 lg:grid-cols-12 lg:items-start lg:gap-16 2xl:max-w-[96rem]">
          <div className="lg:col-span-6">
            <Reveal>
              <span aria-hidden className="block h-[3px] w-12 rounded-full bg-[var(--hz-amber)]" />
              <h2 className="hz-display mt-6 text-[clamp(1.75rem,3.4vw,2.4rem)] text-[var(--hz-text)]">
                An IT services and staffing company.
              </h2>
              <p className="mt-4 max-w-lg text-[15.5px] leading-relaxed text-[var(--hz-text-mute)]">
                {BRAND.legalName} builds and staffs enterprise and government IT. Our consultants work
                on application development, data and systems integration, and the long-running support
                that keeps those systems alive after launch.
              </p>
              <p className="mt-5 max-w-lg text-[15.5px] leading-relaxed text-[var(--hz-text-mute)]">
                We hire across four arrangements, W-2, contract, 1099 and offshore, and we treat all
                four as real jobs: proper onboarding, payroll and immigration paperwork handled, and a
                named person to call when something is wrong.
              </p>
              <p className="mt-5 max-w-lg text-[15.5px] leading-relaxed text-[var(--hz-text-mute)]">
                That last part is what most staffing firms skip, and it is the reason people stay with
                us across engagements.
              </p>
            </Reveal>

            <div className="mt-10">
              {whatWeDo.map((w, i) => (
                <Reveal key={w.title} delay={i * 80}>
                  <div
                    className={`grid grid-cols-[auto_1fr] items-start gap-5 py-6 sm:gap-6 ${
                      i > 0 ? 'border-t border-[var(--hz-line)]' : 'pt-0'
                    }`}
                  >
                    <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]" aria-hidden>
                      <w.icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0">
                      <span className="hz-display block text-[1.2rem] text-[var(--hz-text)]">{w.title}</span>
                      <span className="mt-1.5 block max-w-lg text-[14.5px] leading-relaxed text-[var(--hz-text-mute)]">
                        {w.body}
                      </span>
                    </span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Photo column: sticks while the statements scroll past on desktop */}
          <Reveal delay={120} className="lg:col-span-6 lg:sticky lg:top-24">
            <div className="grid grid-cols-5 gap-4">
              <div className="relative col-span-3 aspect-[4/5] overflow-hidden rounded-[20px] shadow-[var(--hz-shadow-md)]">
                <Image
                  src={PHOTOS.working.src}
                  alt={PHOTOS.working.alt}
                  fill
                  sizes="(max-width: 1024px) 60vw, 30vw"
                  className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.04]"
                />
              </div>
              <div className="relative col-span-2 mt-12 aspect-[3/4] overflow-hidden rounded-[20px] shadow-[var(--hz-shadow-md)]">
                <Image
                  src={PHOTOS.office.src}
                  alt={PHOTOS.office.alt}
                  fill
                  sizes="(max-width: 1024px) 40vw, 20vw"
                  className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.04]"
                />
              </div>
            </div>
            <p className="mt-6 max-w-sm text-[13px] leading-relaxed text-[var(--hz-text-subtle)]">
              Teams in the US and offshore, on the same projects and the same standard.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Culture ── */}
      <section id="culture" className="w-full scroll-mt-24 border-y border-[var(--hz-band-line)] bg-[var(--hz-band)] py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 2xl:max-w-[96rem]">
          <Reveal className="max-w-2xl">
            <Eyebrow>How we work</Eyebrow>
            <h2 className="hz-display mt-4 text-[clamp(1.75rem,3.4vw,2.4rem)] text-[var(--hz-text)]">
              Working at {BRAND.name}.
            </h2>
            <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-[var(--hz-text-mute)]">
              Culture is what happens on a normal Tuesday, not what a poster says. These are the four
              commitments we hold ourselves to, and the practice behind each one, whether you are on
              a client site in the US or working with us from offshore.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-4">
            {culture.map((c, i) => (
              <Reveal key={c.title} delay={i * 80} className="h-full">
                <div className="flex h-full flex-col rounded-2xl border border-[var(--hz-band-line)] bg-white p-6 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:border-[var(--hz-cobalt-100)] hover:shadow-[var(--hz-shadow-md)] sm:p-7">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]" aria-hidden>
                    <c.icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <h3 className="hz-display mt-5 text-[1.15rem] text-[var(--hz-text)]">{c.title}</h3>
                  <p className="mt-2.5 text-[14px] leading-relaxed text-[var(--hz-text-mute)]">{c.body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={200} className="mt-10">
            <Link
              href="/platform"
              className="group inline-flex items-center gap-3 text-[15px] font-semibold text-[var(--hz-cobalt)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hz-cobalt)]"
            >
              See the platform our teams run on
              <span className="grid h-9 w-9 place-items-center rounded-full border border-[var(--hz-line-2)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:border-[var(--hz-cobalt)] group-hover:bg-[var(--hz-cobalt)] group-hover:text-white" aria-hidden>
                <ArrowUpRight className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={1.75} />
              </span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── Full-bleed photograph, one line over it. The visual break between
             how we work and what you get for it. ── */}
      <section className="relative isolate w-full overflow-hidden">
        <div className="relative h-[24rem] w-full sm:h-[28rem] lg:h-[32rem]">
          <Image
            src={PHOTOS.discussion.src}
            alt={PHOTOS.discussion.alt}
            fill
            sizes="100vw"
            className="object-cover object-[68%_center] motion-safe:animate-[hz-settle_2.4s_cubic-bezier(0.22,1,0.36,1)_both]"
          />
          {/* Two layers: a flat scrim for guaranteed contrast, then a left-heavy
              gradient so the text column is the darkest part of the frame. */}
          <div aria-hidden className="absolute inset-0 bg-[#07142b]/55" />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(7,20,43,0.92) 0%, rgba(7,20,43,0.75) 42%, rgba(7,20,43,0.3) 100%)',
            }}
          />
          <div className="absolute inset-0 flex items-center">
            <div className="mx-auto w-full max-w-7xl px-6 sm:px-8 2xl:max-w-[96rem]">
              <Reveal className="max-w-2xl">
                <Eyebrow tone="dark">In practice</Eyebrow>
                <p className="hz-display mt-4 text-[clamp(1.5rem,3.2vw,2.2rem)] leading-[1.15] text-white">
                  The people on the project are the people who decide how it gets built.
                </p>
                <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-white/70">
                  Small teams, short chains, and enough context to make the call. If you need
                  something to do your job well, ask for it.
                </p>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section id="benefits" className="w-full scroll-mt-24 bg-[var(--hz-canvas)] py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 2xl:max-w-[96rem]">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-4">
              <Eyebrow>Benefits</Eyebrow>
              <h2 className="hz-display mt-4 text-[clamp(1.75rem,3.4vw,2.4rem)] text-[var(--hz-text)]">
                Covered, not cornered.
              </h2>
              <p className="mt-4 max-w-sm text-[15.5px] leading-relaxed text-[var(--hz-text-mute)]">
                Benefits vary by arrangement, and your enrollment lives in the portal, so what you
                have is never a mystery.
              </p>
            </Reveal>

            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
              {benefits.map((b, i) => (
                <Reveal key={b.title} delay={i * 80} className="h-full">
                  <div className="flex h-full gap-5 rounded-2xl border border-[var(--hz-line)] bg-white p-6 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:border-[var(--hz-cobalt-100)] hover:shadow-[var(--hz-shadow-md)] sm:p-7">
                    <span className="grid h-11 w-11 flex-none place-items-center rounded-xl bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]" aria-hidden>
                      <b.icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0">
                      <span className="hz-display block text-[1.15rem] text-[var(--hz-text)]">{b.title}</span>
                      <span className="mt-1.5 block text-[14px] leading-relaxed text-[var(--hz-text-mute)]">
                        {b.body}
                      </span>
                    </span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="w-full scroll-mt-24 border-t border-[var(--hz-line)] bg-[var(--hz-canvas)] py-20 sm:py-24 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 sm:px-8 lg:grid-cols-12 lg:gap-16 2xl:max-w-[96rem]">
          <Reveal className="lg:col-span-4">
            <Eyebrow>Questions</Eyebrow>
            <h2 className="hz-display mt-4 text-[clamp(1.75rem,3.4vw,2.4rem)] text-[var(--hz-text)]">
              Common questions.
            </h2>
            <p className="mt-4 max-w-sm text-[15.5px] leading-relaxed text-[var(--hz-text-mute)]">
              What people ask before they join, and what colleagues ask on their first week. If yours
              is not here, write to us.
            </p>
          </Reveal>

          {/* Native <details> so it collapses without JavaScript, stays keyboard
              operable, and keeps every answer in the DOM for search engines. */}
          <div className="lg:col-span-8">
            {faqs.map((f, i) => (
              <Reveal key={f.q} delay={i * 60}>
                <details
                  className={`group ${i > 0 ? 'border-t border-[var(--hz-line)]' : ''}`}
                  name="faq"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hz-cobalt)] [&::-webkit-details-marker]:hidden">
                    <h3 className="hz-display text-[1.1rem] text-[var(--hz-text)] transition-colors group-hover:text-[var(--hz-cobalt)] sm:text-[1.15rem]">
                      {f.q}
                    </h3>
                    <span
                      aria-hidden
                      className="grid h-8 w-8 flex-none place-items-center rounded-full border border-[var(--hz-line-2)] text-[var(--hz-text-mute)] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:border-[var(--hz-cobalt)] group-hover:text-[var(--hz-cobalt)] group-open:rotate-45"
                    >
                      <Plus className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                  </summary>
                  <p className="max-w-2xl pb-6 pr-14 text-[14.5px] leading-relaxed text-[var(--hz-text-mute)]">
                    {f.a}
                  </p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing strip ── */}
      <section className="w-full border-b border-[var(--hz-band-line)] bg-[var(--hz-band)]">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-6 py-14 sm:px-8 sm:py-16 lg:flex-row lg:items-center 2xl:max-w-[96rem]">
          <Reveal className="max-w-xl">
            <h2 className="hz-display text-[clamp(1.5rem,2.8vw,2rem)] text-[var(--hz-text)]">
              Sound like your kind of team?
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--hz-text-mute)]">
              Tell us what you are looking for. Already with {BRAND.name}? Sign in and pick up where
              you left off.
            </p>
          </Reveal>
          <Reveal delay={120} className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Cta href={CONTACT_HREF} variant="primary" icon="mail">Get in touch</Cta>
            <Cta href={`https://${BRAND.domain}`} variant="ghostLight" icon="upRight">Company site</Cta>
          </Reveal>
        </div>
      </section>

      {/* Structured data: the organization, and the questions above. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Organization',
                '@id': `${SITE_URL}/#organization`,
                name: BRAND.legalName,
                alternateName: BRAND.name,
                url: `https://${BRAND.domain}`,
                logo: `${SITE_URL}/logo.png`,
                description: BRAND.description,
                email: BRAND.contactEmail,
                sameAs: [`https://${BRAND.domain}`],
              },
              {
                '@type': 'WebSite',
                '@id': `${SITE_URL}/#website`,
                url: SITE_URL,
                name: `${BRAND.legalName} portal`,
                publisher: { '@id': `${SITE_URL}/#organization` },
                inLanguage: 'en-US',
              },
              {
                '@type': 'FAQPage',
                '@id': `${SITE_URL}/#faq`,
                mainEntity: faqs.map((f) => ({
                  '@type': 'Question',
                  name: f.q,
                  acceptedAnswer: { '@type': 'Answer', text: f.a },
                })),
              },
            ],
          }),
        }}
      />

      <SiteFooter />
    </main>
  );
}
