'use client';

import React from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { BRAND } from '@/config/brand';
import { PHOTOS } from '@/config/photos';
import { Cta, Eyebrow, WordsReveal } from '@/components/landing/ui';
import { HeroTide } from '@/components/landing/HeroTide';

/** Auth-aware hero actions in the shared Cta pill vocabulary. */
function HeroCtas() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center" aria-hidden>
        <div className="h-12 w-44 animate-pulse rounded-full bg-black/5" />
        <div className="h-12 w-40 animate-pulse rounded-full bg-black/5" />
      </div>
    );
  }
  return (
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
      {isAuthenticated ? (
        <Cta href="/dashboard" variant="primary" icon="arrow">Go to your dashboard</Cta>
      ) : (
        <Cta href="/login" variant="primary" icon="arrow">Sign in</Cta>
      )}
      <Cta href="/platform" variant="ghostLight">See the platform</Cta>
    </div>
  );
}

/**
 * How people are engaged here. Four arrangements, named plainly, because the
 * shape of the deal is the first thing anyone weighing a role wants to know,
 * and because supporting all four honestly is what this company is built around.
 */
const arrangements = [
  { type: 'W-2', body: 'Salaried on our payroll, with full benefits and 401(k).' },
  { type: 'Contract', body: 'Project work on a defined engagement, with clear terms.' },
  { type: '1099', body: 'Independent consultants, contracted directly.' },
  { type: 'Offshore', body: 'Our teams outside the US, on local payroll entities.' },
];

function HeroPhoto() {
  return (
    <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-1000 [animation-delay:250ms] [animation-fill-mode:both]">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-8 -z-10 rounded-[3rem]"
        style={{ background: 'radial-gradient(60% 60% at 50% 40%, rgba(29,78,216,0.16) 0%, transparent 70%)' }}
      />
      <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] shadow-[var(--hz-shadow-lg)] lg:aspect-[5/4]">
        <Image
          src={PHOTOS.team.src}
          alt={PHOTOS.team.alt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 48vw"
          className="object-cover"
        />
        {/* A whisper of navy so the photo belongs to the palette */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: 'linear-gradient(200deg, rgba(7,20,43,0) 45%, rgba(7,20,43,0.35) 100%)' }}
        />
      </div>
    </div>
  );
}

/** The four arrangements, as an even strip across the foot of the hero. */
function Arrangements() {
  return (
    <div className="relative mt-16 border-t border-[var(--hz-line)] pt-8 animate-in fade-in slide-in-from-bottom-3 duration-1000 [animation-delay:1000ms] [animation-fill-mode:both] lg:mt-20">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <p className="hz-display text-[1.05rem] text-[var(--hz-text)]">Four ways to work here</p>
        <span className="hz-eyebrow text-[var(--hz-text-subtle)]">Every one fully supported</span>
      </div>

      <dl className="mt-7 grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-4">
        {arrangements.map((a) => (
          <div key={a.type} className="border-t-2 border-[var(--hz-cobalt)]/15 pt-4">
            <dt className="hz-display text-[1.1rem] text-[var(--hz-cobalt)]">{a.type}</dt>
            <dd className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--hz-text-mute)]">{a.body}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * Company-first hero. The page opens on {BRAND.legalName} as a place to work,
 * with the bathymetric tide carrying the brand and sign-in one tap away for the
 * people who are already here.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[var(--hz-canvas)]">
      {/* Quiet canvas: faint grid fading out from the top + one cobalt tint */}
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
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(46% 38% at 82% 12%, rgba(29,78,216,0.07) 0%, transparent 65%)',
        }}
      />
      {/* The living bathymetric chart — Ocean Blue's own topography */}
      <HeroTide tone="light" />

      <div className="relative mx-auto w-full max-w-7xl px-6 pb-16 pt-24 sm:px-8 sm:pb-20 md:pt-32 lg:pb-24 lg:pt-36 2xl:max-w-[96rem]">
        <div className="grid items-center gap-10 sm:gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
          <div className="max-w-xl">
            <span className="animate-in fade-in slide-in-from-bottom-2 duration-700 [animation-fill-mode:both]">
              <Eyebrow>{BRAND.legalName}</Eyebrow>
            </span>

            <h1 className="hz-display mt-6 text-[clamp(2.4rem,5.2vw,4.4rem)] text-[var(--hz-text)]">
              <WordsReveal text="Good people," delay={0.1} />{' '}
              <span className="text-[var(--hz-cobalt)]">
                <WordsReveal text="properly backed." delay={0.4} />
              </span>
            </h1>

            <p className="mt-6 max-w-md text-[16px] leading-relaxed text-[var(--hz-text-mute)] animate-in fade-in slide-in-from-bottom-3 duration-1000 [animation-delay:700ms] [animation-fill-mode:both] sm:text-[17px]">
              We build and staff enterprise and government IT for organizations with real stakes. The
              work is serious, the arrangements are honest, and nobody here is left to figure it out
              alone.
            </p>

            <div className="mt-8 animate-in fade-in slide-in-from-bottom-3 duration-1000 [animation-delay:850ms] [animation-fill-mode:both] sm:mt-9">
              <HeroCtas />
            </div>

            <p className="mt-7 text-[13px] leading-relaxed text-[var(--hz-text-subtle)] animate-in fade-in duration-1000 [animation-delay:1000ms] [animation-fill-mode:both]">
              Already on the team? Sign in for your leave, documents and benefits.
            </p>
          </div>

          <HeroPhoto />
        </div>

        <Arrangements />
      </div>
    </section>
  );
}
