import * as React from 'react';
import { cn } from '@/lib/utils';

/** Loading placeholder — console tone with a shimmer sweep (see .skeleton). */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('skeleton rounded-[8px]', className)} {...props} />;
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3.5', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  );
}

/** Placeholder matching the StatCard footprint, so stats don't jump on load. */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('surface p-5', className)}>
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded-[6px]" />
        <Skeleton className="h-3.5 w-1/3" />
      </div>
      <Skeleton className="mt-3 h-7 w-1/2" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="surface overflow-hidden">
      <div className="border-b border-[var(--adm-line)] bg-[var(--adm-head)] px-4 py-3.5">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-2/3" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-[var(--adm-line-soft)]">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-4 py-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
              {Array.from({ length: cols }).map((_, c) => (
                <Skeleton key={c} className={cn('h-4', c === 0 ? 'w-3/4' : 'w-1/2')} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
