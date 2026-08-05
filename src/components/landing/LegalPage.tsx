import React from 'react';
import { SiteNav } from '@/components/landing/SiteNav';
import { SiteFooter } from '@/components/landing/SiteFooter';
import { Eyebrow } from '@/components/landing/ui';

/**
 * Shell for the policy pages (privacy, terms, accessibility): one column of
 * readable prose at a measured line length, with a section rail on desktop.
 *
 * NOTE FOR MAINTAINERS: the copy in these pages describes how the portal
 * actually behaves, but it has not been through legal review. Have counsel
 * check it before treating it as a binding policy.
 */

export interface LegalSection {
  id: string;
  heading: string;
  /** Paragraphs. */
  body?: string[];
  /** Bulleted points rendered under the paragraphs. */
  points?: string[];
}

export function LegalPage({
  eyebrow,
  title,
  intro,
  updated,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  /** Human date, e.g. "August 2026". */
  updated: string;
  sections: LegalSection[];
}) {
  return (
    <main id="main" className="horizon relative w-full bg-[var(--hz-canvas)]">
      <SiteNav />

      <header className="relative w-full overflow-hidden border-b border-[var(--hz-line)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(15,23,42,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.035) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
            maskImage: 'radial-gradient(75% 60% at 50% 0%, black 0%, transparent 85%)',
            WebkitMaskImage: 'radial-gradient(75% 60% at 50% 0%, black 0%, transparent 85%)',
          }}
        />
        <div className="relative mx-auto w-full max-w-7xl px-6 pb-12 pt-28 sm:px-8 md:pt-32 lg:pb-14 2xl:max-w-[96rem]">
          <div className="max-w-2xl">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className="hz-display mt-5 text-[clamp(2rem,4.2vw,3.2rem)] text-[var(--hz-text)]">{title}</h1>
            <p className="mt-5 text-[15.5px] leading-relaxed text-[var(--hz-text-mute)] sm:text-[16px]">{intro}</p>
            <p className="mt-6 text-[13px] text-[var(--hz-text-subtle)]">Last updated {updated}</p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-16 sm:px-8 sm:py-20 lg:grid-cols-12 lg:gap-16 2xl:max-w-[96rem]">
        {/* Section rail */}
        <nav aria-label="On this page" className="lg:col-span-3 lg:sticky lg:top-24 lg:self-start">
          <h2 className="hz-eyebrow text-[var(--hz-text-subtle)]">On this page</h2>
          <ul className="mt-4 space-y-2">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-[13.5px] text-[var(--hz-text-mute)] transition-colors hover:text-[var(--hz-cobalt)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hz-cobalt)]"
                >
                  {s.heading}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="lg:col-span-8 lg:col-start-5">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className={`scroll-mt-28 ${i > 0 ? 'mt-12 border-t border-[var(--hz-line)] pt-12' : ''}`}>
              <h2 className="hz-display text-[1.35rem] text-[var(--hz-text)] sm:text-[1.5rem]">{s.heading}</h2>
              {s.body?.map((p) => (
                <p key={p} className="mt-4 max-w-2xl text-[15px] leading-[1.75] text-[var(--hz-text-mute)]">
                  {p}
                </p>
              ))}
              {s.points && (
                <ul className="mt-5 max-w-2xl space-y-2.5">
                  {s.points.map((p) => (
                    <li key={p} className="flex gap-3 text-[15px] leading-[1.7] text-[var(--hz-text-mute)]">
                      <span aria-hidden className="mt-[0.7em] h-1 w-1 flex-none rounded-full bg-[var(--hz-cobalt)]" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </article>
      </div>

      <SiteFooter />
    </main>
  );
}
