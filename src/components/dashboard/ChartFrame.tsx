'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Download, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ChartFrame — the single state-handling wrapper every dashboard widget renders
 * through, so loading / empty / error / data are handled uniformly instead of
 * each call-site re-inventing `data.length ? <Chart/> : <p>empty</p>`.
 *
 * Visual chrome mirrors <SectionCard> (surface + header + 5-px body) and adds:
 *  - a freshness/status badge slot,
 *  - optional refresh + export header actions,
 *  - shaped skeletons sized to the chart,
 *  - inline empty state with an optional CTA,
 *  - inline error state with Retry — never blank space.
 *
 * Render precedence: error → loading → empty → children.
 */

export type ChartSkeletonShape = 'bars' | 'area' | 'donut' | 'list' | 'hbar';

export interface ChartFrameProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  /** Extra header content (e.g. a "View all" link) shown left of the action buttons. */
  action?: React.ReactNode;
  /** Small status pill rendered next to the title — e.g. "Live", "Delayed", "Incomplete period". */
  badge?: React.ReactNode;

  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  error?: string;

  /** Chart-shaped skeleton to show while loading. Defaults to 'bars'. */
  skeleton?: ChartSkeletonShape;
  /** Body height in px — keeps the card stable across all four states. */
  height?: number;

  onRetry?: () => void;
  onExport?: () => void;

  emptyLabel?: string;
  emptyHint?: string;
  emptyCta?: { label: string; href: string };

  className?: string;
  children: React.ReactNode;
}

function HeaderButton({
  onClick, title, children,
}: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50"
    >
      {children}
    </button>
  );
}

/* ── Shaped skeletons ─────────────────────────────────────────────────────── */
function Skeleton({ shape, height }: { shape: ChartSkeletonShape; height: number }) {
  if (shape === 'donut') {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div
          className="animate-pulse rounded-full border-[18px] border-slate-100"
          style={{ width: Math.min(height - 40, 200), height: Math.min(height - 40, 200) }}
        />
      </div>
    );
  }
  if (shape === 'list') {
    return (
      <div className="flex flex-col gap-3" style={{ height }}>
        {Array.from({ length: Math.max(3, Math.floor(height / 56)) }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-slate-100" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 w-1/2 animate-pulse rounded-full bg-slate-100" />
              <div className="h-2 w-1/3 animate-pulse rounded-full bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (shape === 'hbar') {
    return (
      <div className="flex flex-col justify-center gap-3" style={{ height }}>
        {[0.9, 0.7, 0.55, 0.4, 0.3].map((w, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-2.5 w-16 animate-pulse rounded-full bg-slate-100" />
            <div className="h-5 animate-pulse rounded bg-slate-100" style={{ width: `${w * 100}%` }} />
          </div>
        ))}
      </div>
    );
  }
  if (shape === 'area') {
    return (
      <div className="flex items-end" style={{ height }}>
        <svg width="100%" height={height} preserveAspectRatio="none" className="animate-pulse">
          <path
            d={`M0,${height * 0.7} C${0.2 * 600},${height * 0.4} ${0.4 * 600},${height * 0.85} ${0.6 * 600},${height * 0.5} S${600},${height * 0.3} 1200,${height * 0.55} L1200,${height} L0,${height} Z`}
            fill="#f1f5f9"
          />
        </svg>
      </div>
    );
  }
  // bars
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {[0.5, 0.8, 0.45, 0.95, 0.6, 0.75, 0.4, 0.85].map((h, i) => (
        <div key={i} className="flex-1 animate-pulse rounded-t bg-slate-100" style={{ height: `${h * 100}%` }} />
      ))}
    </div>
  );
}

export function ChartFrame({
  title, subtitle, icon: Icon, action, badge,
  isLoading, isError, isEmpty, error,
  skeleton = 'bars', height = 260,
  onRetry, onExport,
  emptyLabel = 'No data for this period', emptyHint, emptyCta,
  className, children,
}: ChartFrameProps) {
  let body: React.ReactNode;

  if (isError) {
    body = (
      <div className="flex flex-col items-center justify-center gap-3 text-center" style={{ minHeight: height }}>
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-500 ring-1 ring-red-100">
          <AlertTriangle className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-700">Couldn&apos;t load this data</p>
          {error && <p className="mt-0.5 max-w-xs text-xs text-slate-400">{error}</p>}
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.75} /> Retry
          </button>
        )}
      </div>
    );
  } else if (isLoading) {
    body = <Skeleton shape={skeleton} height={height} />;
  } else if (isEmpty) {
    body = (
      <div className="flex flex-col items-center justify-center gap-2 text-center" style={{ minHeight: height }}>
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-300 ring-1 ring-slate-100">
          <Inbox className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <p className="text-sm font-medium text-slate-500">{emptyLabel}</p>
        {emptyHint && <p className="max-w-xs text-xs text-slate-400">{emptyHint}</p>}
        {emptyCta && (
          <Link
            href={emptyCta.href}
            className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700"
          >
            {emptyCta.label}
          </Link>
        )}
      </div>
    );
  } else {
    body = children;
  }

  return (
    <section className={cn('surface flex flex-col', className)}>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100">
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </span>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate font-display text-base font-bold text-slate-900">{title}</h2>
              {badge}
            </div>
            {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {action}
          {onExport && (
            <HeaderButton onClick={onExport} title="Export">
              <Download className="h-4 w-4" strokeWidth={1.75} />
            </HeaderButton>
          )}
          {onRetry && (
            <HeaderButton onClick={onRetry} title="Refresh">
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} strokeWidth={1.75} />
            </HeaderButton>
          )}
        </div>
      </div>
      <div className="flex-1 p-5">{body}</div>
    </section>
  );
}

/* ── Freshness badge — pairs with ChartFrame.badge ────────────────────────── */
export function FreshnessBadge({ updatedAt }: { updatedAt: number | null }) {
  const [, force] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  if (!updatedAt) return null;
  const mins = Math.floor((Date.now() - updatedAt) / 60_000);
  const fresh = mins < 5;
  const stale = mins >= 15;
  const label = mins < 1 ? 'just now' : `${mins}m ago`;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1',
        stale
          ? 'bg-accent-50 text-accent-700 ring-accent-200'
          : 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      )}
      title={`Updated ${label}`}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', fresh ? 'animate-pulse bg-emerald-500' : stale ? 'bg-accent-500' : 'bg-emerald-400')} />
      {stale ? 'Delayed' : 'Updated'} {label}
    </span>
  );
}
