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
export function Sparkline({ data, color = '#1d4ed8', width = 96, height = 32 }: { data: number[]; color?: string; width?: number; height?: number }) {
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
        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
        good ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
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
  const sparkColor = { brand: '#1d4ed8', emerald: '#059669', amber: '#d97706', red: '#e11d48' }[tone];

  return (
    <div
      onClick={onClick}
      className={cn(
        'group/kpi surface relative overflow-hidden p-5 transition-all',
        onClick && 'cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:border-[var(--adm-line-strong)] hover:shadow-[var(--adm-shadow-md)]',
        alert && 'border-[var(--adm-danger)]/40',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              'grid h-6 w-6 flex-none place-items-center rounded-[6px] transition-colors',
              alert
                ? 'bg-[var(--adm-danger-soft)] text-[var(--adm-danger)]'
                : 'bg-[var(--adm-surface-2)] text-[var(--adm-ink-subtle)] group-hover/kpi:bg-[var(--adm-accent-soft)] group-hover/kpi:text-[var(--adm-accent)]',
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
          </span>
          <p className="flex min-w-0 items-center gap-1 truncate text-[13px] font-medium text-[var(--adm-ink-mute)]">
            {label}
            <span className="group/tip relative inline-flex" tabIndex={0} aria-label={why}>
              <Info className="h-3 w-3 cursor-help text-[var(--adm-ink-subtle)] transition-colors group-hover/tip:text-[var(--adm-ink-mute)]" strokeWidth={2} />
              <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 w-44 -translate-x-1/2 rounded-[8px] bg-[var(--adm-ink)] px-2.5 py-1.5 text-[11px] font-normal leading-snug text-white opacity-0 shadow-[var(--adm-shadow-pop)] transition-opacity duration-150 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100">
                {why}
              </span>
            </span>
          </p>
        </div>
        {delta && <DeltaIndicator delta={delta} period={period} />}
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="tnum min-w-0 truncate text-[26px] font-bold leading-none tracking-[-0.02em] text-[var(--adm-ink)]">{value}</p>
          {period && !delta && <p className="mt-1.5 text-[11px] text-[var(--adm-ink-subtle)]">{period}</p>}
        </div>
        {accessory}
        {sub}
        {spark && spark.length > 0 && !sub && !accessory && <Sparkline data={spark} color={sparkColor} />}
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
      <div className="flex items-center justify-between gap-3 border-b border-[var(--adm-line)] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <span className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[var(--adm-surface-2)] text-[var(--adm-ink-subtle)]">
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </span>
          )}
          <div>
            <h2 className="text-[14px] font-semibold text-[var(--adm-ink)]">{title}</h2>
            {subtitle && <p className="text-[12.5px] text-[var(--adm-ink-mute)]">{subtitle}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="flex-1 p-5">{children}</div>
    </section>
  );
}
