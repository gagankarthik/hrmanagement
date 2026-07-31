'use client';

import React, { useEffect, useRef } from 'react';

/**
 * HeroTide — a living bathymetric chart, Ocean Blue's own topography.
 *
 * Nested irregular depth contours breathe (slow rotate+scale on asymmetric
 * closed paths reads as an organic morph), a luminous "current" traces two of
 * the contour lines, and a sonar ping swells from the deepest point. Two
 * parallax groups drift toward the pointer. Everything animates on the
 * compositor (transform / stroke-dashoffset only); the global reduced-motion
 * killswitch freezes it into a quiet static contour map.
 */

/** Closed 4-anchor blob — with varied radii per ring it reads as a depth contour. */
function blobPath(cx: number, cy: number, [e, s, w, n]: [number, number, number, number]): string {
  const k = 0.55; // circular-arc approximation constant
  return [
    `M${cx + e},${cy}`,
    `C${cx + e},${cy + k * s} ${cx + k * e},${cy + s} ${cx},${cy + s}`,
    `C${cx - k * w},${cy + s} ${cx - w},${cy + k * s} ${cx - w},${cy}`,
    `C${cx - w},${cy - k * n} ${cx - k * w},${cy - n} ${cx},${cy - n}`,
    `C${cx + k * e},${cy - n} ${cx + e},${cy - k * n} ${cx + e},${cy}Z`,
  ].join(' ');
}

type Ring = { radii: [number, number, number, number]; dur: number; reverse?: boolean };

const RINGS: Ring[] = [
  { radii: [100, 85, 95, 80], dur: 44 },
  { radii: [165, 140, 150, 135], dur: 58, reverse: true },
  { radii: [235, 205, 220, 195], dur: 72 },
  { radii: [310, 270, 290, 255], dur: 88, reverse: true },
  { radii: [390, 340, 365, 320], dur: 104 },
];

/** Ring centers drift slightly outward-up so the contours feel hand-charted. */
const ringCenter = (i: number) => ({ cx: 810 - i * 4, cy: 380 - i * 5 });

const TONES = {
  light: {
    line: (i: number) => `rgba(29,78,216,${(0.12 - i * 0.015).toFixed(3)})`,
    currentA: 'rgba(20,191,224,0.45)',
    currentB: 'rgba(29,78,216,0.32)',
    ping: 'rgba(29,78,216,0.14)',
  },
  dark: {
    line: (i: number) => `rgba(163,205,255,${(0.16 - i * 0.02).toFixed(3)})`,
    currentA: 'rgba(92,224,247,0.55)',
    currentB: 'rgba(96,144,250,0.45)',
    ping: 'rgba(163,205,255,0.18)',
  },
} as const;

export function HeroTide({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const ref = useRef<HTMLDivElement>(null);
  const t = TONES[tone];

  // Pointer parallax: two depth groups drift toward the cursor via CSS vars
  // (no React re-renders, rAF-throttled, pointer devices only).
  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        el.style.setProperty('--tx', (e.clientX / window.innerWidth - 0.5).toFixed(3));
        el.style.setProperty('--ty', (e.clientY / window.innerHeight - 0.5).toFixed(3));
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const breathe = (r: Ring) =>
    `hz-tide ${r.dur}s ease-in-out infinite alternate${r.reverse ? '-reverse' : ''}`;

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        maskImage: 'radial-gradient(75% 70% at 62% 45%, black 0%, transparent 85%)',
        WebkitMaskImage: 'radial-gradient(75% 70% at 62% 45%, black 0%, transparent 85%)',
      }}
    >
      <svg className="h-full w-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        {/* Far layer — the contour field */}
        <g style={{ transform: 'translate3d(calc(var(--tx,0)*10px), calc(var(--ty,0)*7px), 0)' }}>
          {RINGS.map((r, i) => {
            const { cx, cy } = ringCenter(i);
            return (
              <path
                key={i}
                d={blobPath(cx, cy, r.radii)}
                fill="none"
                stroke={t.line(i)}
                strokeWidth={1.1}
                style={{ transformBox: 'fill-box', transformOrigin: 'center', animation: breathe(r) }}
              />
            );
          })}
        </g>

        {/* Near layer — currents tracing two contours + the sonar ping */}
        <g style={{ transform: 'translate3d(calc(var(--tx,0)*18px), calc(var(--ty,0)*12px), 0)' }}>
          <path
            d={blobPath(ringCenter(2).cx, ringCenter(2).cy, RINGS[2].radii)}
            fill="none"
            stroke={t.currentA}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeDasharray="70 1330"
            style={{
              transformBox: 'fill-box',
              transformOrigin: 'center',
              animation: `${breathe(RINGS[2])}, hz-current-a 26s linear infinite`,
            }}
          />
          <path
            d={blobPath(ringCenter(4).cx, ringCenter(4).cy, RINGS[4].radii)}
            fill="none"
            stroke={t.currentB}
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeDasharray="90 2160"
            style={{
              transformBox: 'fill-box',
              transformOrigin: 'center',
              animation: `${breathe(RINGS[4])}, hz-current-b 44s linear infinite`,
            }}
          />
          {[0, 3.5].map((delay) => (
            <circle
              key={delay}
              cx={806}
              cy={372}
              r={330}
              fill="none"
              stroke={t.ping}
              strokeWidth={1}
              style={{
                transformBox: 'fill-box',
                transformOrigin: 'center',
                animation: `hz-ping 7s cubic-bezier(0,0,0.2,1) ${delay}s infinite`,
              }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
