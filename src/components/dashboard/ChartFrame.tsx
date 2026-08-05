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
      className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)]"
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
        <span className="grid h-9 w-9 place-items-center rounded-[8px] bg-[var(--adm-danger-soft)] text-[var(--adm-danger)]">
          <AlertTriangle className="h-4.5 w-4.5" strokeWidth={1.75} />
        </span>
        <div>
          <p className="text-[0.9333rem] font-semibold text-[var(--adm-ink)]">Couldn&apos;t load this data</p>
          {error && <p className="mt-0.5 max-w-xs text-xs text-[var(--adm-ink-mute)]">{error}</p>}
        </div>
        {onRetry && (
          <button type="button" onClick={onRetry} className="btn-ghost">
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
        <span className="grid h-9 w-9 place-items-center rounded-[8px] bg-[var(--adm-surface-2)] text-[var(--adm-ink-subtle)]">
          <Inbox className="h-4.5 w-4.5" strokeWidth={1.75} />
        </span>
        <p className="text-[0.9333rem] font-medium text-[var(--adm-ink-mute)]">{emptyLabel}</p>
        {emptyHint && <p className="max-w-xs text-xs text-[var(--adm-ink-subtle)]">{emptyHint}</p>}
        {emptyCta && (
          <Link href={emptyCta.href} className="btn-primary mt-1">
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
      <div className="flex items-center justify-between gap-3 border-b border-[var(--adm-line)] px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon && (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] bg-[var(--adm-surface-2)] text-[var(--adm-ink-subtle)]">
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </span>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-[0.9333rem] font-semibold text-[var(--adm-ink)]">{title}</h2>
              {badge}
            </div>
            {subtitle && <p className="truncate text-[0.8333rem] text-[var(--adm-ink-mute)]">{subtitle}</p>}
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
  const stale = mins >= 15;
  const label = mins < 1 ? 'just now' : `${mins}m ago`;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[4px] px-1.5 py-px text-[0.7rem] font-semibold uppercase tracking-[0.03em]',
        stale
          ? 'bg-[var(--adm-warning-soft)] text-[var(--adm-warning)]'
          : 'bg-[var(--adm-success-soft)] text-[var(--adm-success)]',
      )}
      title={`Updated ${label}`}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', stale ? 'bg-amber-500' : 'bg-emerald-500')} />
      {stale ? 'Delayed' : 'Updated'} {label}
    </span>
  );
}
