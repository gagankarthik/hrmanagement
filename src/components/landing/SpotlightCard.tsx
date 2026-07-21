'use client';

import React, { useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Interactive card that follows the pointer with a soft brand-tinted spotlight
 * and a whisper of tilt. Built on the shared `.surface` primitive so it stays
 * on-brand. Pointer effects are cheap (CSS vars, no re-render) and simply never
 * fire on touch/reduced-motion devices.
 */
export function SpotlightCard({
  children,
  className,
  tilt = true,
}: {
  children: React.ReactNode;
  className?: string;
  tilt?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    el.style.setProperty('--mx', `${x}px`);
    el.style.setProperty('--my', `${y}px`);
    if (tilt) {
      const rx = ((y / r.height) - 0.5) * -4;
      const ry = ((x / r.width) - 0.5) * 4;
      el.style.setProperty('--rx', `${rx}deg`);
      el.style.setProperty('--ry', `${ry}deg`);
    }
  };

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ transform: 'perspective(900px) rotateX(var(--rx,0)) rotateY(var(--ry,0))' }}
      className={cn(
        'group/spot surface relative overflow-hidden transition-[transform,box-shadow,border-color] duration-300 ease-out will-change-transform',
        'hover:-translate-y-0.5 hover:shadow-[0_18px_38px_-18px_rgba(29,78,216,0.28)]',
        className,
      )}
    >
      {/* Pointer spotlight */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{
          background:
            'radial-gradient(240px circle at var(--mx,50%) var(--my,50%), rgba(29,78,216,0.10), transparent 65%)',
        }}
      />
      {/* Gradient ring on hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{
          background:
            'radial-gradient(300px circle at var(--mx,50%) var(--my,50%), rgba(42,216,239,0.14), transparent 60%)',
          mixBlendMode: 'plus-lighter',
        }}
      />
      <div className="relative z-10 flex h-full flex-col">{children}</div>
    </div>
  );
}
