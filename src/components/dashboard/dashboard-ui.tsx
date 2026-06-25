'use client';

import * as React from 'react';
import { Info, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Count-up animation ───────────────────────────────────────────────────── */
export function useCountUp(target: number, ms = 800) {
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setN(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const from = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return n;
}

export function CountUp({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const n = useCountUp(value);
  return <>{n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</>;
}

/* ── Circular progress ring ───────────────────────────────────────────────── */
export function ProgressRing({
  value, size = 60, stroke = 7, color = '#1d4ed8', track = '#e2e8f0', label,
}: { value: number; size?: number; stroke?: number; color?: string; track?: string; label?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 700ms ease' }}
        />
      </svg>
      {label != null && <span className="absolute text-xs font-bold text-slate-900">{label}</span>}
    </div>
  );
}

/* ── Sparkline ────────────────────────────────────────────────────────────── */
export function Sparkline({ data, color = '#266b55', width = 96, height = 32 }: { data: number[]; color?: string; width?: number; height?: number }) {
  if (!data.length) return <div style={{ width, height }} />;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const span = max - min || 1;
  const step = data.length > 1 ? width / (data.length - 1) : width;
  const pts = data.map((v, i) => `${i * step},${height - ((v - min) / span) * height}`).join(' ');
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Period-over-period delta indicator ───────────────────────────────────── */
export interface KpiDelta {
  /** Magnitude of change vs the comparison period, in percent (sign ignored — `direction` decides). */
  value: number;
  direction: 'up' | 'down';
  /** Which direction is "good" — colours the arrow green when direction matches, red otherwise. */
  goodWhen?: 'up' | 'down';
}

export function DeltaIndicator({ delta, period }: { delta: KpiDelta; period?: string }) {
  const good = (delta.goodWhen ?? 'up') === delta.direction;
  const Arrow = delta.direction === 'up' ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums ring-1',
        good ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-red-50 text-red-600 ring-red-100',
      )}
      title={period ? `${delta.direction === 'up' ? '+' : '−'}${Math.abs(delta.value).toFixed(1)}% ${period}` : undefined}
    >
      <Arrow className="h-3 w-3" strokeWidth={2.5} />
      {Math.abs(delta.value).toFixed(1)}%
    </span>
  );
}

/* ── KPI card (with "why this matters" tooltip + optional alert pulse) ─────── */
export function KpiCard({
  icon: Icon, label, value, sub, why, accessory, tone = 'brand', alert = false, onClick,
  delta, spark, period,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  why: string;
  accessory?: React.ReactNode;
  tone?: 'brand' | 'emerald' | 'amber' | 'red';
  alert?: boolean;
  onClick?: () => void;
  /** Period-over-period change — renders an arrow + % pill under the value. */
  delta?: KpiDelta;
  /** Mini trend series for the bottom-right sparkline. */
  spark?: number[];
  /** Human label for the comparison window, e.g. "vs last 30 days". */
  period?: string;
}) {
  const toneStyles = {
    brand: 'bg-brand-50 text-brand-700 ring-brand-100',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    amber: 'bg-accent-50 text-accent-700 ring-accent-100',
    red: 'bg-red-50 text-red-600 ring-red-100',
  }[tone];

  const sparkColor = { brand: '#15847a', emerald: '#059669', amber: '#d97706', red: '#dc2626' }[tone];

  return (
    <div
      onClick={onClick}
      className={cn(
        'group surface relative overflow-hidden p-5 transition-all',
        onClick && 'cursor-pointer hover:-translate-y-0.5',
        alert && 'ring-2 ring-red-300',
      )}
    >
      {alert && <span className="pointer-events-none absolute inset-0 animate-pulse rounded-2xl ring-2 ring-red-300/60" aria-hidden />}
      <div className="flex items-start justify-between gap-3">
        <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl ring-1', toneStyles)}>
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
        {accessory}
      </div>
      <div className="mt-4 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="tnum font-display text-3xl font-bold leading-none text-slate-900">{value}</p>
            {delta && <DeltaIndicator delta={delta} period={period} />}
          </div>
          <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-slate-500">
            {label}
            <span className="group/tip relative inline-flex" tabIndex={0} aria-label={why}>
              <Info className="h-3 w-3 cursor-help text-slate-300 transition-colors group-hover/tip:text-slate-500" strokeWidth={2} />
              <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 w-44 -translate-x-1/2 rounded-lg bg-brand-950 px-2.5 py-1.5 text-[11px] font-normal leading-snug text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100">
                {why}
              </span>
            </span>
          </p>
          {period && !delta && <p className="mt-0.5 text-[11px] text-slate-400">{period}</p>}
        </div>
        {sub}
        {spark && spark.length > 0 && !sub && <Sparkline data={spark} color={sparkColor} />}
      </div>
    </div>
  );
}

/* ── Thermometer / utilization bar ────────────────────────────────────────── */
export function Thermometer({ label, value, target = 75, count }: { label: string; value: number; target?: number; count?: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const tone = pct >= 90 ? 'bg-red-500' : pct >= target ? 'bg-emerald-500' : pct >= 40 ? 'bg-accent-400' : 'bg-slate-300';
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-600">{label}{count != null && <span className="text-slate-400"> · {count}</span>}</span>
        <span className="tnum font-semibold text-slate-900">{pct.toFixed(0)}%</span>
      </div>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className={cn('h-full rounded-full transition-all', tone)} style={{ width: `${pct}%` }} />
        <div className="absolute top-0 h-full w-px bg-slate-400/60" style={{ left: `${target}%` }} title={`Target ${target}%`} />
      </div>
    </div>
  );
}

/* ── Section card ─────────────────────────────────────────────────────────── */
export function SectionCard({
  title, subtitle, icon: Icon, action, children, className,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('surface flex flex-col', className)}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100">
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </span>
          )}
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="flex-1 p-5">{children}</div>
    </section>
  );
}
