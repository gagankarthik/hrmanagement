'use client';

import React, { useRef } from 'react';
import { Sparkles, Rocket } from 'lucide-react';
import { BRAND } from '@/config/brand';

const HERO_IMG =
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1400';

/**
 * The hero visual: a framed photo that tilts toward the pointer with a soft
 * light sweep, plus a floating value card. All motion is pointer-driven via CSS
 * vars (no re-render) and simply idles on touch / reduced-motion devices.
 */
export function HeroShowcase() {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty('--rx', `${(py - 0.5) * -6}deg`);
    el.style.setProperty('--ry', `${(px - 0.5) * 8}deg`);
    el.style.setProperty('--gx', `${px * 100}%`);
    el.style.setProperty('--gy', `${py * 100}%`);
  };

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  return (
    <div className="relative lg:pl-4">
      {/* Soft glow behind the frame */}
      <div
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-brand-200/50 to-accent-200/40 blur-2xl"
        aria-hidden
      />

      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={reset}
        style={{ transform: 'perspective(1100px) rotateX(var(--rx,0)) rotateY(var(--ry,0))' }}
        className="group relative overflow-hidden rounded-3xl border border-white/60 bg-white p-1.5 shadow-[0_30px_70px_-32px_rgba(15,23,42,0.5)] ring-1 ring-black/[0.03] transition-transform duration-300 ease-out will-change-transform"
      >
        <div className="relative overflow-hidden rounded-[1.25rem]">
          {/* Unsplash served via plain <img> to avoid next/image remote config */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={HERO_IMG}
            alt="The Ocean Blue team collaborating in a bright office"
            loading="eager"
            className="aspect-[4/3] h-full w-full scale-[1.02] object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Pointer light sweep */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              background:
                'radial-gradient(420px circle at var(--gx,50%) var(--gy,50%), rgba(255,255,255,0.28), transparent 60%)',
            }}
          />
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-brand-800 shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-accent-500" strokeWidth={2} /> Life at {BRAND.name}
          </span>
        </div>
      </div>

      {/* Floating value card, modern SaaS accent */}
      <div className="absolute -bottom-5 -left-3 hidden max-w-[15rem] items-center gap-3 rounded-2xl border border-slate-100 bg-white/95 p-3.5 shadow-xl backdrop-blur transition-transform duration-300 hover:-translate-y-1 sm:flex">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
          <Rocket className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <p className="text-sm font-semibold leading-snug text-slate-700">
          Grow with mentorship and real ownership
        </p>
      </div>
    </div>
  );
}
