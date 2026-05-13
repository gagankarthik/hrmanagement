'use client';

import * as React from 'react';

interface ConfettiProps {
  /** When true, fires a fresh burst. Component renders nothing when false. */
  active: boolean;
  /** Number of particles. Default 110. */
  count?: number;
  /** Lifetime (ms) before particles auto-clean. Default 3200. */
  duration?: number;
  /** Solid color palette (no gradients). */
  colors?: string[];
}

interface Particle {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotateStart: number;
  rotateEnd: number;
  drift: number;
  sway: number;
  shape: 'sq' | 'rect' | 'dot' | 'tri';
}

const DEFAULT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#0ea5e9', '#a855f7', '#fde047'];

export function Confetti({
  active,
  count = 110,
  duration = 3200,
  colors = DEFAULT_COLORS,
}: ConfettiProps) {
  const [particles, setParticles] = React.useState<Particle[]>([]);
  const [reduceMotion, setReduceMotion] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  React.useEffect(() => {
    if (!active || reduceMotion) {
      setParticles([]);
      return;
    }
    const shapes: Particle['shape'][] = ['sq', 'rect', 'dot', 'tri'];
    const next: Particle[] = Array.from({ length: count }).map((_, i) => {
      const lateralBias = Math.random() < 0.5 ? -1 : 1;
      const launchSpread = 70 + Math.random() * 30; // closer to center
      return {
        id: Date.now() + i,
        // Launch from a fan above the viewport, biased toward center
        left: 50 + lateralBias * (Math.random() * (100 - launchSpread) / 2),
        delay: Math.random() * 220,
        // Particles fall over different lifetimes (slow→fast spread reads "natural")
        duration: 2400 + Math.random() * 1400,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 7 + Math.random() * 9,
        rotateStart: Math.random() * 360,
        rotateEnd: Math.random() * 1440 - 720,
        // Lateral drift in vw — wide spread so it looks like a burst
        drift: (Math.random() - 0.5) * 80,
        // Sway amplitude (sin wave amount)
        sway: 15 + Math.random() * 30,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      };
    });
    setParticles(next);

    const t = setTimeout(() => setParticles([]), duration + 300);
    return () => clearTimeout(t);
  }, [active, count, duration, colors, reduceMotion]);

  if (!active || particles.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[100] overflow-hidden"
    >
      {particles.map((p) => {
        const w = p.shape === 'rect' ? p.size * 0.45 : p.size;
        const h = p.shape === 'rect' ? p.size * 1.35 : p.size;
        let style: React.CSSProperties = {
          top: '-32px',
          left: `${p.left}vw`,
          width: `${w}px`,
          height: `${h}px`,
          backgroundColor: p.color,
          animation: `confetti-fall ${p.duration}ms cubic-bezier(0.22, 0.61, 0.36, 1) ${p.delay}ms forwards`,
          ['--rotate-start' as unknown as string]: `${p.rotateStart}deg`,
          ['--rotate-end' as unknown as string]: `${p.rotateEnd}deg`,
          ['--drift' as unknown as string]: `${p.drift}vw`,
          ['--sway' as unknown as string]: `${p.sway}px`,
        } as React.CSSProperties;
        if (p.shape === 'dot') style.borderRadius = '50%';
        else if (p.shape === 'sq' || p.shape === 'rect') style.borderRadius = '2px';
        else if (p.shape === 'tri') {
          // CSS triangle via border trick
          style = {
            ...style,
            backgroundColor: 'transparent',
            width: 0, height: 0,
            borderLeft: `${w / 2}px solid transparent`,
            borderRight: `${w / 2}px solid transparent`,
            borderBottom: `${h}px solid ${p.color}`,
          };
        }
        return <span key={p.id} className="absolute will-change-transform" style={style} />;
      })}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translate3d(0, 0, 0) rotate(var(--rotate-start));
            opacity: 0;
          }
          5% { opacity: 1; }
          50% {
            transform: translate3d(calc(var(--drift) * 0.55 + var(--sway)), 50vh, 0) rotate(calc((var(--rotate-start) + var(--rotate-end)) * 0.45));
          }
          75% {
            transform: translate3d(calc(var(--drift) * 0.85 - var(--sway) * 0.6), 78vh, 0) rotate(calc((var(--rotate-start) + var(--rotate-end)) * 0.75));
            opacity: 1;
          }
          100% {
            transform: translate3d(var(--drift), 110vh, 0) rotate(calc(var(--rotate-start) + var(--rotate-end)));
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
