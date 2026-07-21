'use client';

import React, { useEffect, useRef, useState } from 'react';
import { GraduationCap, Scale, Users, Target, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Serializable icon keys — icon components can't cross the server→client prop boundary. */
const ICONS: Record<string, LucideIcon> = { GraduationCap, Scale, Users, Target };

type Item = { icon: keyof typeof ICONS | string; title: string; body: string };

/**
 * Interactive 2x2 culture grid. One tile is "active" and slowly auto-advances;
 * hovering pauses it, clicking pins it. The active tile fills with brand color
 * and reveals its supporting line. Uses the same content as the culture cards.
 */
export function CultureShowcase({ items }: { items: Item[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || paused) return;
    timer.current = setInterval(() => {
      setActive((i) => (i + 1) % items.length);
    }, 3200);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused, items.length]);

  return (
    <div className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div
        className="pointer-events-none absolute -inset-5 -z-10 rounded-[2rem] bg-gradient-to-br from-accent-200/40 to-brand-200/40 blur-2xl"
        aria-hidden
      />
      <div className="grid grid-cols-2 gap-4">
        {items.map((c, i) => {
          const on = i === active;
          const Icon = ICONS[c.icon] ?? Target;
          return (
            <button
              key={c.title}
              type="button"
              onClick={() => setActive(i)}
              onMouseEnter={() => setActive(i)}
              aria-pressed={on}
              className={cn(
                'surface group relative flex min-h-[9.5rem] flex-col justify-between overflow-hidden p-5 text-left transition-all duration-300 will-change-transform',
                on
                  ? 'scale-[1.02] border-brand-300 shadow-[0_20px_40px_-20px_rgba(29,78,216,0.4)]'
                  : 'hover:-translate-y-0.5',
              )}
            >
              {/* Active wash */}
              <span
                aria-hidden
                className={cn(
                  'pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-600 to-brand-700 transition-opacity duration-300',
                  on ? 'opacity-100' : 'opacity-0',
                )}
              />
              <span
                className={cn(
                  'relative z-10 flex h-10 w-10 items-center justify-center rounded-xl ring-1 transition-colors duration-300',
                  on
                    ? 'bg-white/15 text-white ring-white/25'
                    : 'bg-brand-50 text-brand-700 ring-brand-100',
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="relative z-10 mt-6">
                <p
                  className={cn(
                    'font-display text-sm font-bold transition-colors duration-300',
                    on ? 'text-white' : 'text-brand-900',
                  )}
                >
                  {c.title}
                </p>
                <p
                  className={cn(
                    'grid text-xs leading-relaxed transition-all duration-300',
                    on
                      ? 'mt-1.5 grid-rows-[1fr] text-white/80 opacity-100'
                      : 'grid-rows-[0fr] opacity-0',
                  )}
                >
                  <span className="overflow-hidden">{c.body}</span>
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Progress dots */}
      <div className="mt-5 flex items-center justify-center gap-2">
        {items.map((c, i) => (
          <button
            key={c.title}
            type="button"
            aria-label={`Show ${c.title}`}
            onClick={() => setActive(i)}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              i === active ? 'w-6 bg-brand-600' : 'w-1.5 bg-slate-300 hover:bg-slate-400',
            )}
          />
        ))}
      </div>
    </div>
  );
}
